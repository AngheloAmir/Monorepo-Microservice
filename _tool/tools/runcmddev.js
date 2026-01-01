const { spawn } = require('child_process');
const path = require('path');

// Store active processes: Map<string, ChildProcess>
const activeProcesses = new Map();

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
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                await stopDevCommand(res, data);
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

    if (activeProcesses.has(id)) {
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

    // Safety check: specific to npm/yarn/pnpm commands
    // They tend to traverse up directories if package.json is missing.
    // We want to strictly enforce them to run only if package.json exists in targetDir.
    if (['npm', 'yarn', 'pnpm'].includes(basecmd)) {
        const pkgJwt = path.join(targetDir, 'package.json');
        if (!fs.existsSync(pkgJwt)) {
             res.writeHead(400, { 'Content-Type': 'text/plain' });
             res.write(`Error: package.json not found in ${directory}.\n`);
             res.end();
             return;
        }
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

    activeProcesses.set(id, child);

    // Heartbeat
    const heartbeat = setInterval(() => {
        if (!child.killed && !res.writableEnded && !res.destroyed) {
            res.write('::HEARTBEAT::\n');
        }
    }, 5000);

    const cleanup = () => {
        clearInterval(heartbeat);
        // See restart/kill logic discussion
    };

    const req = res.req;
    req.on('close', () => {
        // Did the client disconnect?
        if (activeProcesses.get(id) === child) {
            console.log(`[RunCmdDev] Client disconnected for ${id}, killing process.`);
            killProcess(id); 
            cleanup();
        }
    });

    child.stdout.on('data', (data) => {
        if (!res.writableEnded && !res.destroyed) res.write(data);
    });

    child.stderr.on('data', (data) => {
        if (!res.writableEnded && !res.destroyed) res.write(data);
    });

    child.on('close', (code) => {
        clearInterval(heartbeat);
        if (!res.writableEnded && !res.destroyed) {
            res.write(`\n::EXIT::${code}\n`);
            res.end();
        }
        
        // Prevent map corruption: Only delete if WE are the active process
        if (activeProcesses.get(id) === child) {
            activeProcesses.delete(id);
        }
    });

    child.on('error', (err) => {
        clearInterval(heartbeat);
        if (!res.writableEnded && !res.destroyed) {
            res.write(`\nERROR: ${err.message}\n`);
            res.end();
        }
        
        if (activeProcesses.get(id) === child) {
            activeProcesses.delete(id);
        }
    });
}

async function stopDevCommand(res, { id, stopcmd, directory }) {
    console.log(`[RunCmdDev] Stopping ${id}...`);
    
    const child = activeProcesses.get(id);
    let killed = false;

    if (child) {
        killProcess(id); // This marks it for death, but it might take time
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
             try {
                await new Promise((resolve) => {
                    const sc = spawn(stopcmd, {
                        cwd: targetDir,
                        shell: true,
                        stdio: 'ignore'
                    });
                    
                    // Force timeout of 10s for stop command
                    const timeout = setTimeout(() => {
                         if(!sc.killed) sc.kill();
                         resolve();
                    }, 10000);

                    sc.on('close', () => { clearTimeout(timeout); resolve(); });
                    sc.on('error', () => { clearTimeout(timeout); resolve(); });
                });
             } catch(e) {
                 console.error('Stop command failed', e);
             }
        } else {
            console.log(`[RunCmdDev] Directory not found for stop command: ${targetDir}, skipping.`);
        }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, killed }));
}

function killProcess(id) {
    const child = activeProcesses.get(id);
    if (child) {
        // process.kill(-child.pid) for process groups if detached
        child.kill(); 
        activeProcesses.delete(id);
    }
}

module.exports = { runCmdDevHandler };
