const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
        res.writeHead(400).end('Missing directory, basecmd');
        return;
    }

    const jobId = id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const rootDir = path.resolve(__dirname, '../../');
    const targetDir = path.join(rootDir, directory);

    if (!isCommandAvailable(basecmd)) {
         res.writeHead(400, { 'Content-Type': 'text/plain' });
         res.end(`${basecmd} is not installed.`);
         return;
    }

    // --- STREAM HEADERS ---
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff' 
    });

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

    // Heartbeat
    const heartbeat = setInterval(() => {
        res.write('::HEARTBEAT::\n');
    }, 2000);

    child.stdout.on('data', (data) => {
        res.write(data);
    });

    child.stderr.on('data', (data) => {
        res.write(data);
    });

    child.on('close', (code) => {
        clearInterval(heartbeat);
        activeJobs.delete(jobId); // Cleanup from map
        res.write(`\n Process exited with code: ${code}\n`);
        res.end();
    });

    child.on('error', (err) => {
        clearInterval(heartbeat);
        activeJobs.delete(jobId);
        res.write(`\nERROR: ${err.message}\n`);
        res.end();
    });
}

function getActiveJobs() {
    return activeJobs;
}

module.exports = { runCmdJobHandler, getActiveJobs };
