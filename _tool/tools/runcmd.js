const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getIO } = require('./runcmddev_shared');

function runCmdHandler(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            executeCommand(res, data);
        } catch (e) {
            console.error('RunCmd Parse Error:', e);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
    });
}

function executeCommand(res, { directory, basecmd, cmd, extraEnv = {} }) {
    if (!directory || !basecmd) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing directory or command' }));
        return;
    }

    const rootDir = path.resolve(__dirname, '../../');
    const targetDir = path.join(rootDir, directory);
    
    // Generate a temporary ID for this one-off command so the client can listen to it
    // We expect the client to generate an ID or we generate one. 
    // Usually for one-off commands, the client generates a unique ID to filter logs.
    // For now, let's assume the client will listen to a generic 'install-log' event 
    // OR BETTER: The client sends an ID.
    // Looking at repoNew.js, it DOES NOT send an ID for runcmd. 
    // So we must rely on a broad broadcast or change the contract.
    // BUT! Since we are refactoring, we can't easily change repoNew.js's current fetch logic 
    // without breaking it. 
    // Wait, I AM updating repoNew.js.
    
    // So, let's make repoNew.js send an `id` for the installation session.
    // But wait, the previous `executeCommand` logic didn't take an ID because it was a direct stream response.
    
    // Let's create a temp ID.
    const runId = `cmd-${Date.now()}`;

    if (['npm', 'yarn', 'pnpm'].includes(basecmd)) {
        const pkgJwt = path.join(targetDir, 'package.json');
        if (!fs.existsSync(pkgJwt)) {
             res.writeHead(400, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ error: `package.json not found in ${directory}. Aborting.` }));
             return;
        }
    }
    
    // Send 200 OK with the runId so the client knows what to listen to
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, runId }));
    
    const io = getIO();
    const safeEmit = (text) => {
        if(io) io.emit('runcmd-log', { id: runId, text });
    };

    // Prepare Environment
    const env = { 
        ...process.env, 
        ...extraEnv,
        // TERM: 'dumb', // This disables colors
        FORCE_COLOR: '1', // This forces 16-color ANSI output
        NPM_CONFIG_AUDIT: 'false',
        NPM_CONFIG_FUND: 'false',
        NPM_CONFIG_PROGRESS: 'false',
        CI: 'true' 
    };

    // Sanitize npm environment variables
    Object.keys(env).forEach(key => {
        if (key.startsWith('npm_') || key.startsWith('NPM_') || key === 'INIT_CWD') {
             if (!['NPM_CONFIG_AUDIT', 'NPM_CONFIG_FUND', 'NPM_CONFIG_PROGRESS'].includes(key)) {
                delete env[key];
             }
        }
    });
    
    const args = Array.isArray(cmd) ? cmd : [cmd];
    if (basecmd === 'npx') {
        if (!args.includes('--yes')) args.push('--yes');
    }

    const child = spawn(basecmd, args, {
        cwd: targetDir,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'], 
        shell: true,
        detached: false // One-off commands don't need to be detached usually, but safely handling them is good
    });

    safeEmit(`> Starting one-off command: ${basecmd} ${args.join(' ')}\n`);

    child.stdout.on('data', (data) => safeEmit(data.toString()));
    child.stderr.on('data', (data) => safeEmit(data.toString()));

    child.on('close', (code) => {
        safeEmit(`\nCommand exited with code: ${code}\n`);
        safeEmit(`::DONE::`); // Special signal?
    });

    child.on('error', (err) => {
        safeEmit(`\nERROR: ${err.message}\n`);
        safeEmit(`::DONE::`);
    });
}

module.exports = { runCmdHandler };
