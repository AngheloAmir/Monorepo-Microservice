const fs = require('fs');
const path = require('path');

const workspaceFilePath = path.join(__dirname, '../tooldata/Workspace.js');

const serveWorkspaceData = (res, req, directory) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    try {
        const fullPath = path.join(__dirname, '../tooldata/', directory);
        if (require.cache[require.resolve(fullPath)]) {
            delete require.cache[require.resolve(fullPath)];
        }
        const workspaceData = require(fullPath);

        // Augment workspace data with scripts from package.json
        const rootDir = path.resolve(__dirname, '../../');
        
        const augmentItem = (item) => {
            if (!item.path) return item;
            try {
                const pkgPath = path.join(rootDir, item.path, 'package.json');
                if (fs.existsSync(pkgPath)) {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                    const scripts = pkg.scripts || {};
                    
                    item.devcmd   = scripts.dev || '';
                    item.startcmd = scripts.start || '';
                    item.stopcmd  = scripts.stop || '';
                    item.buildcmd = scripts.build || '';
                    item.lintcmd  = scripts.lint || '';
                    item.testcmd  = scripts.test || '';
                }
            } catch (e) {
                console.error(`Error reading package.json for ${item.name}:`, e);
            }
            return item;
        };

        Object.keys(workspaceData).forEach(key => {
            if (Array.isArray(workspaceData[key])) {
                workspaceData[key] = workspaceData[key].map(augmentItem);
            }
        });

        res.end(JSON.stringify(workspaceData));
    } catch (e) {
        console.error(e);
        res.end(JSON.stringify({}));
    }
}

const writeWorkspaceFile = (data) => {
    const content = `/**
 * Workspace Data
 */

const workspace = ${JSON.stringify(data, null, 4)}

module.exports = workspace;
`;
    fs.writeFileSync(workspaceFilePath, content, 'utf8');
}

const updateWorkspaceData = (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { id, data } = JSON.parse(body);
            const firstHyphen = id.indexOf('-');
            if (firstHyphen === -1) throw new Error('Invalid ID format');
            
            const section = id.substring(0, firstHyphen).toLowerCase();
            const name    = id.substring(firstHyphen + 1);

            if (require.cache[require.resolve(workspaceFilePath)]) {
                delete require.cache[require.resolve(workspaceFilePath)];
            }
            const workspaceData = require(workspaceFilePath);
            
            const index = workspaceData[section] ? workspaceData[section].findIndex(item => item.name === name) : -1;

            if (index !== -1) {
                const existingItem = workspaceData[section][index];
                
                // Prepare object for storage (exclude commands that now live in package.json)
                const storageItem = { ...existingItem, ...data };
                const commandFields = ['devcmd', 'startcmd', 'stopcmd', 'buildcmd', 'lintcmd', 'testcmd', 'installcmd'];
                commandFields.forEach(field => delete storageItem[field]);

                // Update storage data
                workspaceData[section][index] = storageItem;
                writeWorkspaceFile(workspaceData);
                
                // Update package.json scripts (using full data including commands)
                const scriptUpdateItem = { ...existingItem, ...data };
                updateWorkspaceScripts(scriptUpdateItem);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                throw new Error('Workspace not found: ' + section + ' ' + name);
            }
        } catch (e) {
            console.error(e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

const deleteWorkspaceData = (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { id } = JSON.parse(body);
            const firstHyphen = id.indexOf('-');
            if (firstHyphen === -1) throw new Error('Invalid ID format');
            
            const section = id.substring(0, firstHyphen).toLowerCase();
            const name    = id.substring(firstHyphen + 1);

            if (require.cache[require.resolve(workspaceFilePath)]) {
                delete require.cache[require.resolve(workspaceFilePath)];
            }
            const workspaceData = require(workspaceFilePath);
            
            const index = workspaceData[section] ? workspaceData[section].findIndex(item => item.name === name) : -1;

            if (index !== -1) {
                const item = workspaceData[section][index];
                
                // Delete folder if path exists
                if (item.path) {
                    const rootDir = path.resolve(__dirname, '../../');
                    const absPath = path.join(rootDir, item.path);
                    if (fs.existsSync(absPath)) {
                        fs.rmSync(absPath, { recursive: true, force: true });
                    }
                }

                // Remove from array
                workspaceData[section].splice(index, 1);
                
                writeWorkspaceFile(workspaceData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                throw new Error('Workspace not found: ' + section + ' ' + name);
            }
        } catch (e) {
            console.error(e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

const updateWorkspaceScripts = (item) => {
    if (!item.path) return;
    try {
        const rootDir = path.resolve(__dirname, '../../');
        const pkgPath = path.join(rootDir, item.path, 'package.json');
        
        if (!fs.existsSync(pkgPath)) return;
        
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (!pkg.scripts) pkg.scripts = {};

        const map = {
            'dev':   item.devcmd,
            'start': item.startcmd,
            'stop':  item.stopcmd,
            'build': item.buildcmd,
            'lint':  item.lintcmd,
            'test':  item.testcmd
        };

        for (const [key, val] of Object.entries(map)) {
             if (val === undefined) continue; 
             
             const cmd = val.trim();
             
             if (cmd === '') {
                 if (pkg.scripts[key]) delete pkg.scripts[key];
                 continue;
             }

             // Safety checks for recursion
             if (cmd.match(new RegExp(`^npm\\s+(run|run-script)\\s+${key}\\b`))) continue; 
             if (cmd.match(new RegExp(`^npm\\s+${key}\\b`))) continue;

             pkg.scripts[key] = cmd;
        }

        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    } catch (e) {
        console.error('Error updating package.json scripts:', e);
    }
}

module.exports = {
    serveWorkspaceData,
    updateWorkspaceData,
    deleteWorkspaceData
}