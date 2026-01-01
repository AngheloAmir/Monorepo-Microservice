const { spawn } = require('child_process');
const path = require('path');

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

function executeCommand(res, { directory, basecmd, cmd }) {
    if (!directory || !basecmd) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing directory or command');
        return;
    }

    const rootDir = path.resolve(__dirname, '../../');
    const targetDir = path.join(rootDir, directory);
    const fs = require('fs'); // Ensure fs is available

    if (['npm', 'yarn', 'pnpm'].includes(basecmd)) {
        const pkgJwt = path.join(targetDir, 'package.json');
        if (!fs.existsSync(pkgJwt)) {
             res.writeHead(400, { 'Content-Type': 'text/plain' });
             res.end(`Error: package.json not found in ${directory}. Aborting.`);
             return;
        }
    }

    // Prepare headers for streaming
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff' 
    });

    console.log(`[RunCmd] Spawning ${basecmd} ${cmd} in ${targetDir}`);

    // Prepare Environment
    const env = { 
        ...process.env, 
        TERM: 'dumb',
        NPM_CONFIG_AUDIT: 'false',
        NPM_CONFIG_FUND: 'false',
        NPM_CONFIG_PROGRESS: 'false',
        CI: 'true' // Often suppresses interactive prompts
    };
    
    // Ensure cmd is an array
    const args = Array.isArray(cmd) ? cmd : [cmd];

    // Automate YES for npm install if not present (simple heuristic)
    if (basecmd === 'npm' || basecmd === 'npx') {
        if (!args.includes('--yes')) args.push('--yes');
    }

    const child = spawn(basecmd, args, {
        cwd: targetDir,
        env: env,
        stdio: ['ignore', 'pipe', 'pipe'], // Ignore stdin, pipe stdout/stderr
        shell: true,
        detached: false
    });

    // Heartbeat to keep connection alive if command is silent for a while
    const heartbeat = setInterval(() => {
        res.write('::HEARTBEAT::\n');
    }, 2000);

    const cleanup = () => {
        clearInterval(heartbeat);
        try { child.kill(); } catch(e) {}
    };

    req = res.req; // Get the request object from response
    req.on('close', cleanup); // Client disconnected

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
    });

    child.on('error', (err) => {
        clearInterval(heartbeat);
        res.write(`\nERROR: ${err.message}\n`);
        res.end();
    });
}

module.exports = { runCmdHandler };
