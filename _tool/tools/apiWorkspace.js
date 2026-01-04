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
                // Merge updates
                workspaceData[section][index] = { ...workspaceData[section][index], ...data };
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

module.exports = {
    serveWorkspaceData,
    updateWorkspaceData,
    deleteWorkspaceData
}