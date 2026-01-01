const { spawn } = require('child_process');
const path = require('path');

// Store active processes: { "uniqueId": childProcess }
const activeProcesses = {};

function runCmdDevHandler(req, res) {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                startDevCommand(res, data);
            } catch (e) {
                console.error('RunCmdDev Parse Error:', e);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else if (req.method === 'DELETE') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                stopDevCommand(res, data);
            } catch (e) {
                res.writeHead(400);
                res.end();
            }
        });
    }
}

function startDevCommand(res, { directory, basecmd, cmd, id }) {
    if (!directory || !basecmd || !id) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing directory, command, or id');
        return;
    }

    if (activeProcesses[id]) {
        res.writeHead(409, { 'Content-Type': 'text/plain' });
        res.end('Process already running for this ID');
        return;
    }

    const fs = require('fs');

    const rootDir = path.resolve(__dirname, '../../');
    const targetDir = path.join(rootDir, directory);

    if (!fs.existsSync(targetDir)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.write(`Error: Directory not found: ${directory}\n`);
        res.end();
        return;
    }

    // Prepare headers for streaming
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff' 
    });

    console.log(`[RunCmdDev] Spawning [${id}] ${basecmd} ${cmd} in ${targetDir}`);

    const env = { 
        ...process.env, 
        TERM: 'xterm-256color', // Support color
        FORCE_COLOR: '1'
    };
    
    const args = Array.isArray(cmd) ? cmd : cmd.split(' ');

    const child = spawn(basecmd, args, {
        cwd: targetDir,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'], 
        shell: true,
        detached: false // Keep attached to manage easier, or true if we want it to survive server restart (but here we want control)
    });

    activeProcesses[id] = child;

    // Heartbeat
    const heartbeat = setInterval(() => {
        if (!child.killed) {
            res.write('::HEARTBEAT::\n');
        }
    }, 5000);

    const cleanup = () => {
        clearInterval(heartbeat);
        // We do NOT kill the process on request close for "persist" feel if the user just closes tab? 
        // But the requirement says "optimize... open stream almost forever until it is closed". 
        // Only explicit stop should kill it?
        // IF the client disconnects (tab closed), we usually lose the stream. 
        // But the process might want to stay alive? 
        // For now, if the connection breaks, let's keep the process alive in memory 
        // so we could potentially reconnect to it? 
        // IMPLEMENTATION: for simplicity, if connection closes, we don't kill the process unless explicitly requested via DELETE.
        // However, we can't "re-attach" to the stdout stream easily without more complex logic (broadcasting).
        // Let's stick to: client disconnect -> assume we want to keep it running? 
        // NO, typically for a "Start Dev" in a gui tool, if I close the GUI, I might want it to stop.
        // But if I just switch tabs? The stream closes.
        // Let's kill it on disconnect for now to avoid zombies, UNLESS we implement a re-attachable stream manager.
        // Given complexity, let's kill on output stream failure/close for now to be safe, 
        // OR implement explicit kill.
        
        // Actually, the user asked for "optimize that it will open the stream almost forever until it is closed".
        // Let's interpret "closed" as the explicit Close button affecting StopCmd.
    };

    req = res.req;
    req.on('close', () => {
        // Option A: Kill process. Option B: Leave it running.
        // Going with Option A for resource safety unless requested otherwise.
        if (activeProcesses[id] === child) {
            console.log(`[RunCmdDev] Client disconnected for ${id}, killing process.`);
            killProcess(id); 
            cleanup();
        }
    });

    child.stdout.on('data', (data) => {
        res.write(data);
    });

    child.stderr.on('data', (data) => {
        res.write(data);
    });

    child.on('close', (code) => {
        clearInterval(heartbeat);
        res.write(`\n::EXIT::${code}\n`);
        res.end();
        delete activeProcesses[id];
    });

    child.on('error', (err) => {
        clearInterval(heartbeat);
        res.write(`\nERROR: ${err.message}\n`);
        res.end();
        delete activeProcesses[id];
    });
}

function stopDevCommand(res, { id, stopcmd, directory }) {
    console.log(`[RunCmdDev] Stopping ${id}...`);
    
    const child = activeProcesses[id];
    let killed = false;

    if (child) {
        killProcess(id);
        killed = true;
    }

    // If there is a specific stop command (like 'npm run stop'), execute it too
    // This is useful for docker compose down etc.
    if (stopcmd && directory) {
        const rootDir = path.resolve(__dirname, '../../');
        const targetDir = path.join(rootDir, directory);
        console.log(`[RunCmdDev] Executing stop command: ${stopcmd}`);
        
        const fs = require('fs');
        if (fs.existsSync(targetDir)) {
            spawn(stopcmd, {
                cwd: targetDir,
                shell: true,
                stdio: 'ignore'
            });
        } else {
            console.log(`[RunCmdDev] Directory not found for stop command: ${targetDir}, skipping.`);
        }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, killed }));
}

function killProcess(id) {
    const child = activeProcesses[id];
    if (child) {
        // process.kill(-child.pid) for process groups if detached
        child.kill(); 
        delete activeProcesses[id];
    }
}

module.exports = { runCmdDevHandler };
