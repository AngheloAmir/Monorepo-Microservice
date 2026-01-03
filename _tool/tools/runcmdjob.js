const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getIO } = require('./runcmddev_shared');

/**
 * Global store for active job processes
 * Map<id, { child: ChildProcess, config: object, startTime: number }>
 */
const activeJobs = new Map();

function isCommandAvailable(cmd) {
    try {
        const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
        execSync(checkCmd, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function runCmdJobHandler(req, res) {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
             try {
                const data = JSON.parse(body);
                executeJob(res, data);
            } catch (e) {
                console.error('RunCmdJob Parse Error:', e);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
}

function executeJob(res, config) {
    const { directory, basecmd, cmd, id } = config;

    if (!directory || !basecmd) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing directory, basecmd' }));
        return;
    }

    const jobId = id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const rootDir = path.resolve(__dirname, '../../');
    const targetDir = path.join(rootDir, directory);

    if (!isCommandAvailable(basecmd)) {
         res.writeHead(400, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ error: `${basecmd} is not installed.` }));
         return;
    }

    const io = getIO();
    const safeEmit = (text) => {
        if(io) io.emit('job-log', { id: jobId, text });
    };

    // Return Success immediately
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, jobId }));

    const env = { 
        ...process.env, 
        TERM: 'dumb',
        CI: 'true',
        FORCE_COLOR: '0', 
        NPM_CONFIG_PROGRESS: 'false'
    };
    
    const args = Array.isArray(cmd) ? cmd : (cmd ? cmd.split(' ') : []);

    const child = spawn(basecmd, args, {
        cwd: targetDir,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        detached: false
    });

    // Register job
    activeJobs.set(jobId, {
        child: child,
        config: config,
        startTime: Date.now()
    });
    
    safeEmit(`> Starting Job ${jobId}: ${basecmd} ${args.join(' ')}\n`);

    child.stdout.on('data', (data) => safeEmit(data.toString()));
    child.stderr.on('data', (data) => safeEmit(data.toString()));

    child.on('close', (code) => {
        activeJobs.delete(jobId); // Cleanup from map
        safeEmit(`\nJob exited with code: ${code}\n`);
    });

    child.on('error', (err) => {
        activeJobs.delete(jobId);
        safeEmit(`\nERROR: ${err.message}\n`);
    });
}

function getActiveJobs() {
    return activeJobs;
}

module.exports = { runCmdJobHandler, getActiveJobs };
