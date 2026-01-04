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
             
             if (isRunning) {
                 res.writeHead(409, { 'Content-Type': 'application/json' });
                 res.end(JSON.stringify({ error: 'A Turbo task is already running. Please wait.' }));
                 return;
             }
             
             // Allow passing manualCommand array for custom stuff like ['turbo', 'clean']
             // OR action string for 'run <action>'
             startTurboProcess(res, action, manualCommand);

         } catch (e) {
             res.writeHead(400, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ error: 'Invalid JSON' }));
         }
    });
}

function startTurboProcess(res, action, manualCommand) {
    isRunning = true;
    const runId = `turbo-${Date.now()}`;
    const workspaceRoot = path.resolve(__dirname, '../../');
    
    let args = [];
    let baseCmd = 'npx'; // Use npx to ensure we use local turbo or download it
    
    if (manualCommand && Array.isArray(manualCommand)) {
        args = ['--yes', ...manualCommand];
    } else if (action === 'install') {
        baseCmd = 'npm';
        args = ['install'];
    } else if (action) {
        args = ['--yes', 'turbo', 'run', action]; // "npx --yes turbo run dev"
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

module.exports = { handleTurboRequest };
