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
                // 1. Fetch latest changes from remote to ensure comparisons against origin/... are valid
                // We ignore errors here in case offline or no remote
                try {
                     await runExec(rootDir, 'git', ['fetch']);
                } catch (e) {
                    console.warn("Git fetch failed (offline?):", e.message);
                }

                const currentBranch = (await runExec(rootDir, 'git', ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
                
                // Get list of changed files compared to base branch
                // git diff --name-only origin/main...HEAD
                
                // Check if we are checking against just "master" or "main" and if we are ON that branch.
                // If baseBranch is "master" and current is "master", comparisons are empty.
                // We typically want to compare against the *upstream* version if we are on the main branch.
                // Or user should configure baseBranch as 'origin/master'.
                
                let actualBase = baseBranch;
                if (!baseBranch.includes('/') && currentBranch === baseBranch) {
                    // If we are on 'master' and base is 'master', we likely want 'origin/master'
                    actualBase = `origin/${baseBranch}`;
                }

                const diffFiles = await runExec(rootDir, 'git', ['diff', '--name-only', `${actualBase}...HEAD`]);

                // Dry run turbo to see what would happen
                // npx turbo run build --filter=[origin/main...HEAD] --dry=json
                
                let dryJson = null;
                let turboError = null;
                try {
                     // Use the sensitive actualBase
                     const turboOutput = await runExec(rootDir, 'npx', ['turbo', 'run', 'build', `--filter=[${actualBase}...HEAD]`, '--dry=json']);
                     dryJson = JSON.parse(turboOutput); 
                } catch(e) {
                    turboError = e.message;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    currentBranch: currentBranch,
                    baseBranch: actualBase, // Return the one we actually used
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
