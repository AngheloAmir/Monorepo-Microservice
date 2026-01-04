const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { activeProcesses, safeEmit, isCommandAvailable } = require('./runcmddev_shared');

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
            // Check root (monorepo) node_modules before failing
            if (!fs.existsSync(path.join(rootDir, 'node_modules'))) {
                 res.writeHead(400, { 'Content-Type': 'application/json' });
                 res.end(JSON.stringify({ error: 'node_modules missing. Run install first.' }));
                 return;
            }
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
        safeEmit(id, msg);
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

    // Sanitize npm environment variables
    Object.keys(env).forEach(key => {
        if (key.startsWith('npm_') || key.startsWith('NPM_') || key === 'INIT_CWD') {
             if (!['NPM_CONFIG_AUDIT', 'NPM_CONFIG_FUND', 'NPM_CONFIG_PROGRESS'].includes(key)) {
                delete env[key];
             }
        }
    });

    const child = spawn(basecmd, args, {
        cwd: targetDir,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        detached: process.platform !== 'win32' 
    });

    entry.child = child;
    const startTime = Date.now();

    child.stdout.on('data', (data) => safeEmit(id, data.toString()));
    child.stderr.on('data', (data) => safeEmit(id, data.toString()));

    child.on('close', (code) => {
        const currentEntry = activeProcesses.get(id);
        const uptime = Date.now() - startTime;

        safeEmit(id, `\n[System] Process ${id} exited with code ${code}\n`);

        // If sucessful exit (0), do not restart
        if (code === 0) {
            if (currentEntry) currentEntry.shouldRun = false;
            safeEmit(id, `[System] Process completed successfully.\n`);
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
            safeEmit(id, `[System] Attempting restart ${currentEntry.restartCount}/5 in ${delay/1000}s...\n`);
            
            setTimeout(() => {
                if (currentEntry.shouldRun) spawnAndMonitor(id);
            }, delay);
        } else {
            // Process ended intentionally or naturally
            safeEmit(id, `[System] Process finished.\n`);
        }
    });

    child.on('error', (err) => {
        safeEmit(id, `\n[System Error] Launch failed: ${err.message}\n`);
    });
}

module.exports = { startDevCommand, spawnAndMonitor };
