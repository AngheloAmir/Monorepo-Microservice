const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function handleDeployScriptRequest(req, res) {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const { action } = data;

            if (action === 'get-workspaces') {
                getWorkspacesWithScripts(res);
            } else if (action === 'save-script') {
                saveWorkspaceScript(res, data.workspacePath, data.scriptName, data.command);
            } else if (action === 'get-turbo-json') {
                getTurboJson(res);
            } else if (action === 'save-turbo-json') {
                saveTurboJson(res, data.pipeline);
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid action' }));
            }
        } catch (e) {
            console.error(e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    });
}

function getWorkspacesWithScripts(res) {
    const workspaceRoot = path.resolve(__dirname, '../../');
    const tooldataPath = path.resolve(__dirname, '../tooldata/Workspace.js');
    


    try {
        if (require.cache[require.resolve(tooldataPath)]) {
            delete require.cache[require.resolve(tooldataPath)];
        }
        const workspaceData = require(tooldataPath);


        const workspaces = [];
        
        ['backend', 'frontend', 'service', 'database', 'shared'].forEach(section => {
            if(workspaceData[section]) {
                workspaceData[section].forEach(ws => {
                    const pkgPath = path.join(workspaceRoot, ws.path, 'package.json');
                    let scripts = {};
                    if(fs.existsSync(pkgPath)) {
                        try {
                            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                            scripts = pkg.scripts || {};
                        } catch(e) {
                            console.error(`Error reading package.json for ${ws.name}`, e);
                        }
                    } else {
                        console.warn(`Package.json not found at ${pkgPath}`);
                    }
                    
                    workspaces.push({
                        name: ws.name,
                        path: ws.path,
                        type: ws.type,
                        icon: ws.icon,
                        scripts: scripts
                    });
                });
            }
        });
        

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ workspaces }));
    } catch (e) {
        console.error("Error in getWorkspacesWithScripts:", e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to load workspace data' }));
    }
}

function saveWorkspaceScript(res, relativePath, scriptName, command) {
    const workspaceRoot = path.resolve(__dirname, '../../');
    const pkgPath = path.join(workspaceRoot, relativePath, 'package.json');
    
    if (!fs.existsSync(pkgPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Package.json not found' }));
        return;
    }

    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (!pkg.scripts) pkg.scripts = {};
        
        pkg.scripts[scriptName] = command;
        
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
    } catch (e) {
        console.error(e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to save script: ' + e.message }));
    }
}

function getTurboJson(res) {
    const workspaceRoot = path.resolve(__dirname, '../../');
    const turboPath = path.join(workspaceRoot, 'turbo.json');

    if (fs.existsSync(turboPath)) {
        try {
            const turbo = JSON.parse(fs.readFileSync(turboPath, 'utf8'));
            // Turbo 2.0 uses 'tasks', older uses 'pipeline'
            const pipelineData = turbo.tasks || turbo.pipeline || {};
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ pipeline: pipelineData }));
        } catch(e) {
             res.writeHead(500, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ error: 'Failed to parse turbo.json' }));
        }
    } else {
         // Create default if missing or just return empty
         res.writeHead(200, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ pipeline: {} }));
    }
}

function saveTurboJson(res, pipeline) {
    const workspaceRoot = path.resolve(__dirname, '../../');
    const turboPath = path.join(workspaceRoot, 'turbo.json');
    
    try {
        let turbo = {};
        if (fs.existsSync(turboPath)) {
            turbo = JSON.parse(fs.readFileSync(turboPath, 'utf8'));
        }
        
        // Determine whether to use 'tasks' or 'pipeline'
        // If 'tasks' exists, use it. If 'pipeline' exists, use it.
        // If neither, use 'tasks' (modern default).
        if (turbo.tasks) {
            turbo.tasks = pipeline;
        } else if (turbo.pipeline) {
            turbo.pipeline = pipeline;
        } else {
            turbo.tasks = pipeline;
        }
        
        fs.writeFileSync(turboPath, JSON.stringify(turbo, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
    } catch(e) {
         console.error(e);
         res.writeHead(500, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ error: 'Failed to save turbo.json' }));
    }
}

module.exports = { handleDeployScriptRequest };
