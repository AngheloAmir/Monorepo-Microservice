const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Map<id, { child: ChildProcess, config: object, shouldRun: boolean }>
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
    const { directory, basecmd, cmd, id } = config;

    if (!directory || !basecmd || !id) {
        res.writeHead(400).end('Missing directory, command, or id');
        return;
    }

    if (activeProcesses.has(id)) {
        res.writeHead(409).end('Process already running for this ID');
        return;
    }

    const rootDir = path.resolve(__dirname, '../../');
    const targetDir = path.join(rootDir, directory);

    if (!fs.existsSync(targetDir)) {
        res.writeHead(404).end(`Directory not found: ${directory}`);
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff'
    });

    activeProcesses.set(id, { 
        child: null, 
        config: { ...config, targetDir }, 
        shouldRun: true 
    });

    spawnAndMonitor(id, res);
}

function spawnAndMonitor(id, res = null) {
    const entry = activeProcesses.get(id);
    if (!entry || !entry.shouldRun) return;

    const { basecmd, cmd, targetDir } = entry.config;
    const args = Array.isArray(cmd) ? cmd : cmd.split(' ');

    /**
     * ENVIRONMENT TUNING
     * - TERM: dumb (removes interactive prompts/colors that break logs)
     * - CI: true (tells Vite/NPM to run in non-interactive mode)
     * - FORCE_COLOR: 0 (ensures clean text logs)
     */
    const env = { 
        ...process.env,
        TERM: 'dumb',
        CI: 'true',
        FORCE_COLOR: '0',
        NPM_CONFIG_PROGRESS: 'false',
        NPM_CONFIG_SPIN: 'false'
    };

    const child = spawn(basecmd, args, {
        cwd: targetDir,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        // Detached is key for killing the whole group (Vite/Docker sub-processes)
        detached: process.platform !== 'win32' 
    });

    entry.child = child;

    child.stdout.on('data', (data) => {
        if (res && !res.writableEnded) res.write(data);
    });

    child.stderr.on('data', (data) => {
        if (res && !res.writableEnded) res.write(data);
    });

    child.on('close', (code) => {
        const currentEntry = activeProcesses.get(id);
        
        if (res && !res.writableEnded) {
            res.write(`\n[System] Process ${id} closed with code ${code}\n`);
        }

        if (currentEntry && currentEntry.shouldRun) {
            const delay = 3000;
            if (res && !res.writableEnded) res.write(`[System] Restarting in ${delay/1000}s...\n`);
            setTimeout(() => {
                if (currentEntry.shouldRun) spawnAndMonitor(id, null);
            }, delay);
        } else if (res && !res.writableEnded) {
            res.end();
        }
    });

    child.on('error', (err) => {
        if (res && !res.writableEnded) {
            res.write(`\n[System Error] ${err.message}\n`);
            res.end();
        }
    });
}

async function stopDevCommand(res, { id, stopcmd, directory }) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' });

    const entry = activeProcesses.get(id);
    
    if (entry) {
        entry.shouldRun = false; 
        
        if (entry.child) {
            res.write(`> Terminating process tree for ${id}...\n`);
            try {
                if (process.platform === 'win32') {
                    // Windows: Kill parent and all children
                    spawn('taskkill', ['/pid', entry.child.pid, '/T', '/F']);
                } else {
                    // Unix: Kill the process group (negative PID)
                    process.kill(-entry.child.pid, 'SIGKILL');
                }
            } catch (e) {
                entry.child.kill('SIGKILL');
            }
        }
        activeProcesses.delete(id);
    }

    // Optional Cleanup (Docker Compose Down, etc.)
    if (stopcmd && directory) {
        const rootDir = path.resolve(__dirname, '../../');
        const targetDir = path.join(rootDir, directory);
        if (fs.existsSync(targetDir)) {
            res.write(`> Executing stop command: ${stopcmd}\n`);
            await new Promise(resolve => {
                const sc = spawn(stopcmd, { cwd: targetDir, shell: true, env: { CI: 'true' } });
                sc.on('close', resolve);
                sc.on('error', resolve);
                setTimeout(resolve, 10000); // 10s timeout for docker cleanup
            });
        }
    }
    
    res.write(`> Successfully stopped ${id}.\n`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    res.end();
}

/**
 * RECOVERY LOGIC
 * If the main server crashes, we try to kill orphaned children
 */
process.on('exit', () => {
    for (const [id, entry] of activeProcesses) {
        if (entry.child) {
            try {
                process.kill(process.platform === 'win32' ? entry.child.pid : -entry.child.pid);
            } catch (e) {}
        }
    }
});

module.exports = { runCmdDevHandler };