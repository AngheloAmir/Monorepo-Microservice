const { spawn } = require('child_process');
const path = require('path');
const { getIO } = require('./runcmddev_shared');

let isRunning = false;
let currentChild = null;

function handleTurboRequest(req, res) {
    if (req.method !== 'POST') {
         res.writeHead(405, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ error: 'Method Not Allowed' }));
         return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
         try {
             const data = JSON.parse(body);
             const { action, manualCommand } = data; 
             
             if (isRunning && action !== 'stop') {
                 res.writeHead(409, { 'Content-Type': 'application/json' });
                 res.end(JSON.stringify({ error: 'A Turbo task is already running. Please wait.' }));
                 return;
             }
             
             // Allow passing manualCommand array for custom stuff like ['turbo', 'clean']
             // OR action string for 'run <action>'

             if (action === 'stop') {
                 stopTurboProcess(res);
             } else if (action === 'get-graph') {
                 getTurboGraph(res);
             } else if (action === 'prune') {
                 const { scope } = data;
                 if (!scope) {
                     res.writeHead(400, { 'Content-Type': 'application/json' });
                     res.end(JSON.stringify({ error: 'Scope is required for prune' }));
                     return;
                 }
                 startTurboProcess(res, action, null, scope);
             } else if (['login', 'link', 'unlink'].includes(action)) {
                 startTurboProcess(res, action);
             } else {
                 startTurboProcess(res, action, manualCommand);
             }

         } catch (e) {
             res.writeHead(400, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ error: 'Invalid JSON' }));
         }
    });
}

function startTurboProcess(res, action, manualCommand, scope) {
    isRunning = true;
    const runId = `turbo-${Date.now()}`;
    const workspaceRoot = path.resolve(__dirname, '../../');
    
    let args = [];
    let baseCmd = 'npx'; // Use npx to ensure we use local turbo or download it
    
    if (manualCommand && Array.isArray(manualCommand)) {
        args = ['--no-install', ...manualCommand]; 
    } else if (action === 'install') {
        baseCmd = 'npm';
        args = ['install'];
    } else if (action === 'prune') {
        args = ['--no-install', 'turbo', 'prune', `--scope=${scope}`, '--docker'];
    } else if (['login', 'link', 'unlink'].includes(action)) {
        args = ['--no-install', 'turbo', action];
    } else if (action) {
        args = ['--no-install', 'turbo', 'run', action]; // "npx --no-install turbo run dev"
    } else {
         res.writeHead(400, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ error: 'No action specified' }));
         isRunning = false;
         return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, runId }));

    const io = getIO();
    const emit = (text) => {
        if(io) io.emit('runcmd-log', { id: runId, text });
    };

    emit(`> Executing in ${workspaceRoot}: ${baseCmd} ${args.join(' ')}\n`);

    const env = { ...process.env, FORCE_COLOR: '1' }; 

    currentChild = spawn(baseCmd, args, {
        cwd: workspaceRoot,
        env: env,
        shell: true,
        detached: true, // Key for group kill
        stdio: ['ignore', 'pipe', 'pipe']
    });

    currentChild.stdout.on('data', (data) => emit(data.toString()));
    currentChild.stderr.on('data', (data) => emit(data.toString()));

    currentChild.on('close', (code) => {
        isRunning = false;
        currentChild = null;
        emit(`\n> Turbo task finished with code ${code}\n`);
        emit('::DONE::'); 
    });

    currentChild.on('error', (err) => {
        isRunning = false;
        currentChild = null;
        emit(`\n> Failed to start turbo: ${err.message}\n`);
        emit('::DONE::');
    });
}

function stopTurboProcess(res) {
    if (!isRunning || !currentChild) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'No process running' }));
        return;
    }

    const killProcess = (pid) => {
        try {
            if (process.platform === 'win32') {
                 spawn('taskkill', ['/pid', pid, '/T', '/F']);
            } else {
                 process.kill(-pid, 'SIGKILL'); // Kill process group
            }
        } catch (e) {
            // Process might be gone already
        }
    };

    killProcess(currentChild.pid);
    
    // Force reset state to unblock, in case close event doesn't fire or is delayed
    isRunning = false;
    currentChild = null;

    // We don't force isRunning=false here, we let the close event handle it
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Stop requested' }));
}


function getTurboGraph(res) {
    const workspaceRoot = path.resolve(__dirname, '../../');
    const turboArgs = ['turbo', 'run', 'build', '--dry=json'];

    runExec(workspaceRoot, 'npx', turboArgs)
        .then(output => {
            try {
                // Find the JSON part if there is extra noise (npx can be noisy)
                // But usually --dry=json is clean if force color is off
                const graphJson = JSON.parse(output);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ graph: graphJson }));
            } catch (e) {
                console.error("JSON Parse Error", e); //, output
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to parse graph output' }));
            }
        })
        .catch(err => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Graph generation failed: ' + err.message }));
        });
}

function runExec(cwd, command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            shell: true,
            env: { ...process.env, CI: 'true', FORCE_COLOR: '0' }
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', d => stdout += d.toString());
        child.stderr.on('data', d => stderr += d.toString());

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
            }
        });
        
        child.on('error', (err) => reject(err));
    });
}

module.exports = { handleTurboRequest };
