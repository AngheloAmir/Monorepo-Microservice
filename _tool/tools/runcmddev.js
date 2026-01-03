const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Global store for active processes
 * Map<id, { child: ChildProcess, config: object, shouldRun: boolean, restartCount: number }>
 */
const activeProcesses = new Map();
let io = null;

function initSocket(socketIo) {
    io = socketIo;
    io.on('connection', (socket) => {
        socket.on('join-log', (id) => {
            socket.join(id);
            if(activeProcesses.has(id)) {
                 socket.emit('log', { id, text: `::ATTACHED:: Process ${id} is running.\n` });
            }
        });
    });
}

/**
 * Checks if the system has the required binary (docker, npm, etc.)
 */
function isCommandAvailable(cmd) {
    try {
        const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
        execSync(checkCmd, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function runCmdDevHandler(req, res) {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                startDevCommand(res, data);
            } catch (e) {
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
                res.writeHead(400).end();
            }
        });
    }
}

function startDevCommand(res, config) {
    const { directory, basecmd, id } = config;

    if (!directory || !basecmd || !id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing directory, basecmd, or id' }));
        return;
    }

    if (activeProcesses.has(id)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Process already running' }));
        return;
    }

    const rootDir = path.resolve(__dirname, '../../');
    const targetDir = path.join(rootDir, directory);

    // --- PRE-FLIGHT CHECKS ---
    if (!fs.existsSync(targetDir)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Directory not found: ${directory}` }));
        return;
    }

    if (!isCommandAvailable(basecmd)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `${basecmd} is not installed on this server.` }));
        return;
    }

    // Node-specific checks (Nodemon, NPM, etc.)
    if (['npm', 'yarn', 'pnpm', 'nodemon', 'node'].includes(basecmd)) {
        if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'package.json missing in target directory.' }));
            return;
        }
        if (!fs.existsSync(path.join(targetDir, 'node_modules'))) {
             res.writeHead(400, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ error: 'node_modules missing. Run install first.' }));
             return;
        }
    }

    // Docker-specific checks
    if (basecmd.includes('docker')) {
        const hasDockerConfig = fs.existsSync(path.join(targetDir, 'Dockerfile')) || 
                               fs.existsSync(path.join(targetDir, 'docker-compose.yml'));
        if (!hasDockerConfig) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No Dockerfile or docker-compose.yml found.' }));
            return;
        }
    }

    // --- INITIALIZE PROCESS ---
    activeProcesses.set(id, { 
        child: null, 
        config: { ...config, targetDir }, 
        shouldRun: true,
        restartCount: 0 
    });

    // Return Success immediately
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));

    // Start background process
    spawnAndMonitor(id);
}

function spawnAndMonitor(id) {
    const entry = activeProcesses.get(id);
    if (!entry || !entry.shouldRun) return;

    // Safety: prevent infinite crash loop (max 5 rapid restarts)
    if (entry.restartCount > 5) {
        const msg = `\n[System] CRITICAL: Process ${id} crashed too many times. Auto-restart disabled.\n`;
        if(io) io.to(id).emit('log', { text: msg });
        entry.shouldRun = false;
        return;
    }

    const { basecmd, cmd, targetDir } = entry.config;
    const args = Array.isArray(cmd) ? cmd : cmd.split(' ');

    const env = { 
        ...process.env,
        TERM: 'dumb',
        CI: 'true',
        FORCE_COLOR: '0',
        NPM_CONFIG_PROGRESS: 'false'
    };

    const child = spawn(basecmd, args, {
        cwd: targetDir,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        detached: process.platform !== 'win32' 
    });

    entry.child = child;
    const startTime = Date.now();

    const safeEmit = (text) => {
        if(io) io.to(id).emit('log', { id, text });
    };

    child.stdout.on('data', (data) => safeEmit(data.toString()));
    child.stderr.on('data', (data) => safeEmit(data.toString()));

    child.on('close', (code) => {
        const currentEntry = activeProcesses.get(id);
        const uptime = Date.now() - startTime;

        safeEmit(`\n[System] Process ${id} exited with code ${code}\n`);

        // If sucessful exit (0), do not restart
        if (code === 0) {
            if (currentEntry) currentEntry.shouldRun = false;
            safeEmit(`[System] Process completed successfully.\n`);
            return;
        }

        // Only restart if the user hasn't explicitly stopped it
        if (currentEntry && currentEntry.shouldRun) {
            if (uptime < 10000) {
                currentEntry.restartCount++;
            } else {
                currentEntry.restartCount = 0; 
            }

            const delay = 5000;
            safeEmit(`[System] Attempting restart ${currentEntry.restartCount}/5 in ${delay/1000}s...\n`);
            
            setTimeout(() => {
                if (currentEntry.shouldRun) spawnAndMonitor(id);
            }, delay);
        } else {
            // Process ended intentionally or naturally
            safeEmit(`[System] Process finished.\n`);
        }
    });

    child.on('error', (err) => {
        safeEmit(`\n[System Error] Launch failed: ${err.message}\n`);
    });
}

async function stopDevCommand(res, { id, stopcmd, directory }) {
    const entry = activeProcesses.get(id);
    const safeEmit = (text) => {
        if(io) io.to(id).emit('log', { id, text });
    };
    
    if (entry) {
        entry.shouldRun = false; 
        
        if (entry.child && entry.child.pid) {
            safeEmit(`> Terminating process tree for ${id}...\n`);
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', entry.child.pid, '/T', '/F']);
                } else {
                    process.kill(-entry.child.pid, 'SIGKILL');
                }
            } catch (e) {
                entry.child.kill('SIGKILL');
            }
        }
        activeProcesses.delete(id);
    }

    if (stopcmd && directory) {
        const rootDir = path.resolve(__dirname, '../../');
        const targetDir = path.join(rootDir, directory);
        if (fs.existsSync(targetDir)) {
            safeEmit(`> Running shutdown command: ${stopcmd}\n`);
            await new Promise(resolve => {
                const sc = spawn(stopcmd, { cwd: targetDir, shell: true, env: { CI: 'true' } });
                sc.on('close', resolve);
                sc.on('error', resolve);
                setTimeout(resolve, 15000); 
            });
        }
    }
    
    safeEmit(`> Process ${id} is stopped.\n`);
    
    // Return standard JSON success
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
}

process.on('exit', () => {
    for (const [id, entry] of activeProcesses) {
        if (entry.child && entry.child.pid) {
            try {
                const pid = entry.child.pid;
                process.platform === 'win32' ? spawn('taskkill', ['/pid', pid, '/T', '/F']) : process.kill(-pid);
            } catch (e) {}
        }
    }
});

function getActiveProcesses() { return activeProcesses; }
function getActiveProcessCount() { return activeProcesses.size; }

module.exports = { runCmdDevHandler, getActiveProcessCount, getActiveProcesses, initSocket };
