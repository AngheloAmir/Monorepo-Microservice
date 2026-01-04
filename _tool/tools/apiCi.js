const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Handles CI/CD specific command executions.
 * It is designated to run 'git' and 'turbo' commands that are non-interactive.
 */
function apiCiHandler(req, res) {
    if (req.method !== 'POST') {
        res.writeHead(405);
        res.end('Method Not Allowed');
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const payload = JSON.parse(body);
            await processRequest(res, payload);
        } catch (e) {
            console.error('API CI Parse Error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
}

async function processRequest(res, { action }) {
    // 1. Load CICD Config
    // In a real app, we might want to reload this every time, or cache it.
    // The user's file is at _tool/tooldata/cicd.js
    let cicdConfig = {};
    try {
        const configPath = path.resolve(__dirname, '../tooldata/cicd.js');
        delete require.cache[require.resolve(configPath)]; // Ensure fresh load
        cicdConfig = require(configPath);
    } catch (e) {
        console.warn("Could not load tooldata/cicd.js, using defaults", e);
        cicdConfig = { baseBranch: 'origin/main', remoteRepositoryUrl: '' };
    }

    const { baseBranch } = cicdConfig;
    const rootDir = path.resolve(__dirname, '../../'); // Project Root

    // 2. Dispatch Action
    switch(action) {
        case 'get-config':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(cicdConfig));
            break;

        case 'save-config': 
            // NOTE: This usually requires a separate 'save' method that writes to file.
            // For now, we return 501 or just success if we assume the client saves via another API? 
            // The user asked for "real", so let's allow saving if data is passed.
            // But we didn't implement a generic 'writeJsFile' utility yet. 
            // Let's implement a basic write for now if requested in payload.
            res.writeHead(501, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Save config not fully implemented in backend yet' }));
            break;

        case 'check-status':
            // Run Git and Turbo analysis
            try {
                const currentBranch = await runExec(rootDir, 'git', ['rev-parse', '--abbrev-ref', 'HEAD']);
                
                // Get list of changed files compared to base branch
                // git diff --name-only origin/main...HEAD
                // Note: If origin/main doesn't exist locally, this might fail.
                const diffFiles = await runExec(rootDir, 'git', ['diff', '--name-only', `${baseBranch}...HEAD`]);

                // Dry run turbo to see what would happen
                // npx turbo run build --filter=[origin/main...HEAD] --dry=json
                // We use --dry=json to get parsing
                
                let dryJson = null;
                let turboError = null;
                try {
                     const turboOutput = await runExec(rootDir, 'npx', ['turbo', 'run', 'build', `--filter=[${baseBranch}...HEAD]`, '--dry=json']);
                     // The output might contain logs before the JSON, so we need to find the JSON blob.
                     // Turbo dry json usually outputs just json, but let's be safe.
                     dryJson = JSON.parse(turboOutput); 
                } catch(e) {
                    turboError = e.message;
                    // Fallback: use changed files to "guess" or just report git diff
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    currentBranch: currentBranch.trim(),
                    baseBranch: baseBranch,
                    changedFiles: diffFiles.split('\n').filter(Boolean),
                    turboPlan: dryJson,
                    turboError
                }));

            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message, details: 'Ensure git is initialized and base branch exists.' }));
            }
            break;

        default:
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unknown action' }));
    }
}

/**
 * Helper to run a command and return stdout as string.
 * This is "synchronous-like" but async await.
 */
function runExec(cwd, command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            shell: true,
            env: { ...process.env, CI: 'true', FORCE_COLOR: '0' } // No color for parsing
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', d => stdout += d.toString());
        child.stderr.on('data', d => stderr += d.toString());

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
            }
        });
        
        child.on('error', (err) => reject(err));
    });
}

module.exports = { apiCiHandler };
