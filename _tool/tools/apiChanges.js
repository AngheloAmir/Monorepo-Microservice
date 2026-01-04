const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Handles Changes/CI specific command executions.
 */
function apiChangesHandler(req, res) {
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
            console.error('API Changes Parse Error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
}

const CONFIG_PATH = path.resolve(__dirname, '../tooldata/baserepo.js');

async function processRequest(res, { action, data }) {
    // 1. Load Config from baserepo.js
    let repoConfig = {};
    try {
        delete require.cache[require.resolve(CONFIG_PATH)]; // Ensure fresh load
        repoConfig = require(CONFIG_PATH);
    } catch (e) {
        console.warn("Could not load tooldata/baserepo.js, using defaults", e);
        repoConfig = { baseBranch: 'origin/master', remoteRepositoryUrl: '' };
    }

    const { baseBranch } = repoConfig;
    const rootDir = path.resolve(__dirname, '../../'); // Project Root

    // 2. Dispatch Action
    switch(action) {
        case 'get-config':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(repoConfig));
            break;

        case 'save-config':
            try {
                // Update config object
                const newConfig = { ...repoConfig, ...data };
                
                // Construct JS file content
                const fileContent = `const baserepo = ${JSON.stringify(newConfig, null, 4)}\n\nmodule.exports = baserepo;`;
                
                fs.writeFileSync(CONFIG_PATH, fileContent);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, config: newConfig }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to save config: ' + e.message }));
            }
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
                
                // Smart Base Branch Logic
                let actualBase = baseBranch || 'origin/master';
                // If config says 'master' but we are ON 'master', auto-switch to 'origin/master'
                if (!actualBase.includes('/') && currentBranch === actualBase) {
                    actualBase = `origin/${actualBase}`;
                }

                // Check diff
                const diffFilesOutput = await runExec(rootDir, 'git', ['diff', '--name-only', `${actualBase}...HEAD`]);
                const diffFiles = diffFilesOutput.split('\n').filter(Boolean);

                // Dry run turbo to see what would happen
                let dryJson = null;
                let turboError = null;
                try {
                     // Prepare Turbo Args
                     const turboArgs = ['turbo', 'run', 'build', `--filter=[${actualBase}...HEAD]`, '--dry=json'];
                     
                     // Apply Configured Settings
                     if (repoConfig.turboRemoteCache === false) {
                         turboArgs.push('--no-remote-cache');
                     }
                     if (repoConfig.turboTeam) {
                         turboArgs.push(`--team=${repoConfig.turboTeam}`);
                     }

                     const turboOutput = await runExec(rootDir, 'npx', turboArgs);
                     dryJson = JSON.parse(turboOutput); 
                } catch(e) {
                    turboError = e.message;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    currentBranch: currentBranch,
                    baseBranch: actualBase, // Return the one we actually used
                    changedFiles: diffFiles,
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

module.exports = { apiChangesHandler };
