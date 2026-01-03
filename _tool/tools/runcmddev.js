const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Global store for active processes
 * Map<id, { child: ChildProcess, config: object, shouldRun: boolean, restartCount: number }>
 */
const activeProcesses = new Map();

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
        res.writeHead(400).end('Missing directory, basecmd, or id');
        return;
    }

    if (activeProcesses.has(id)) {
        res.writeHead(409).end('Process already running');
        return;
    }

    const rootDir = path.resolve(__dirname, '../../');
    const targetDir = path.join(rootDir, directory);

    // --- PRE-FLIGHT CHECKS ---
    if (!fs.existsSync(targetDir)) {
        res.writeHead(404).end(`Directory not found: ${directory}`);
        return;
    }

    if (!isCommandAvailable(basecmd)) {
        res.writeHead(400).end(`${basecmd} is not installed on this server.`);
        return;
    }

    // Node-specific checks (Nodemon, NPM, etc.)
    if (['npm', 'yarn', 'pnpm', 'nodemon', 'node'].includes(basecmd)) {
        if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
            res.writeHead(400).end('package.json missing in target directory.');
            return;
        }
        if (!fs.existsSync(path.join(targetDir, 'node_modules'))) {
            res.writeHead(400).end('node_modules missing. Run install first.');
            return;
        }
    }

    // Docker-specific checks
    if (basecmd.includes('docker')) {
        const hasDockerConfig = fs.existsSync(path.join(targetDir, 'Dockerfile')) || 
                               fs.existsSync(path.join(targetDir, 'docker-compose.yml'));
        if (!hasDockerConfig) {
            res.writeHead(400).end('No Dockerfile or docker-compose.yml found.');
            return;
        }
    }

    // --- INITIALIZE STREAM ---
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff'
    });

    activeProcesses.set(id, { 
        child: null, 
        config: { ...config, targetDir }, 
        shouldRun: true,
        restartCount: 0 
    });

    spawnAndMonitor(id, res);
}

function spawnAndMonitor(id, res = null) {
    const entry = activeProcesses.get(id);
    if (!entry || !entry.shouldRun) return;

    // Safety: prevent infinite crash loop (max 5 rapid restarts)
    if (entry.restartCount > 5) {
        const msg = `\n[System] CRITICAL: Process ${id} crashed too many times. Auto-restart disabled.\n`;
        if (res && !res.writableEnded) { res.write(msg); res.end(); }
        entry.shouldRun = false;
        return;
    }

    const { basecmd, cmd, targetDir } = entry.config;
    const args = Array.isArray(cmd) ? cmd : cmd.split(' ');

    /**
     * Virtual Terminal Environment:
     * - TERM: dumb (removes control characters)
     * - CI: true (disables interactive prompts)
     * - FORCE_COLOR: 0 (clean logs)
     */
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

    child.stdout.on('data', (data) => {
        if (res && !res.writableEnded) res.write(data);
    });

    child.stderr.on('data', (data) => {
        if (res && !res.writableEnded) res.write(data);
    });

    child.on('close', (code) => {
        const currentEntry = activeProcesses.get(id);
        const uptime = Date.now() - startTime;

        if (res && !res.writableEnded) {
            res.write(`\n[System] Process ${id} exited with code ${code}\n`);
        }

        // Only restart if the user hasn't explicitly stopped it
        if (currentEntry && currentEntry.shouldRun) {
            // If it died in under 10 seconds, it's a "bad" crash
            if (uptime < 10000) {
                currentEntry.restartCount++;
            } else {
                currentEntry.restartCount = 0; // Success, reset the counter
            }

            const delay = 3000;
            if (res && !res.writableEnded) {
                res.write(`[System] Attempting restart ${currentEntry.restartCount}/5 in ${delay/1000}s...\n`);
            }
            
            setTimeout(() => {
                if (currentEntry.shouldRun) spawnAndMonitor(id, null);
            }, delay);
        } else if (res && !res.writableEnded) {
            res.end();
        }
    });

    child.on('error', (err) => {
        if (res && !res.writableEnded) {
            res.write(`\n[System Error] Launch failed: ${err.message}\n`);
            res.end();
        }
    });
}

async function stopDevCommand(res, { id, stopcmd, directory }) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' });

    const entry = activeProcesses.get(id);
    
    if (entry) {
        // 1. Tell the monitor NOT to restart it
        entry.shouldRun = false; 
        
        // 2. Kill the process and all its children (Nodemon/Vite/Express)
        if (entry.child) {
            res.write(`> Terminating process tree for ${id}...\n`);
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', entry.child.pid, '/T', '/F']);
                } else {
                    // Kill the process group (negative PID)
                    process.kill(-entry.child.pid, 'SIGKILL');
                }
            } catch (e) {
                entry.child.kill('SIGKILL');
            }
        }
        activeProcesses.delete(id);
    }

    // 3. Optional: Run specific stop commands (like docker-compose down)
    if (stopcmd && directory) {
        const rootDir = path.resolve(__dirname, '../../');
        const targetDir = path.join(rootDir, directory);
        if (fs.existsSync(targetDir)) {
            res.write(`> Running shutdown command: ${stopcmd}\n`);
            await new Promise(resolve => {
                const sc = spawn(stopcmd, { cwd: targetDir, shell: true, env: { CI: 'true' } });
                sc.on('close', resolve);
                sc.on('error', resolve);
                setTimeout(resolve, 15000); // 15s limit for cleanup tasks
            });
        }
    }
    
    res.write(`> Process ${id} is stopped.\n`);
    res.end();
}

/**
 * Handle server shutdown: Kill all managed children so they don't become zombies
 */
process.on('exit', () => {
    for (const [id, entry] of activeProcesses) {
        if (entry.child) {
            try {
                const pid = entry.child.pid;
                process.platform === 'win32' ? spawn('taskkill', ['/pid', pid, '/T', '/F']) : process.kill(-pid);
            } catch (e) {}
        }
    }
});

function getActiveProcesses() {
    return activeProcesses;
}

function getActiveProcessCount() {
    return activeProcesses.size;
}

module.exports = { runCmdDevHandler, getActiveProcessCount, getActiveProcesses };
