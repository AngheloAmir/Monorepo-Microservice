const fs = require('fs');
const path = require('path');

const repoFilePath = path.join(__dirname, '../tooldata/repository.js');

const serveRepositoryData = (res, req, directory) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    try {
        const fullPath = path.join(__dirname, '../tooldata/', directory);
        if (require.cache[require.resolve(fullPath)]) {
            delete require.cache[require.resolve(fullPath)];
        }
        const repoData = require(fullPath);
        res.end(JSON.stringify(repoData));
    } catch (e) {
        console.error(e);
        res.end(JSON.stringify({}));
    }
}

const writeRepositoryFile = (data) => {
    const content = `/**
 * Repository Data
 */

const repository = ${JSON.stringify(data, null, 4)}

module.exports = repository;
`;
    fs.writeFileSync(repoFilePath, content, 'utf8');
}

const updateRepositoryData = (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { id, data } = JSON.parse(body);
            const [section, indexStr] = id.split('-');
            const index = parseInt(indexStr);

            if (require.cache[require.resolve(repoFilePath)]) {
                delete require.cache[require.resolve(repoFilePath)];
            }
            const repoData = require(repoFilePath);
            
            if (repoData[section] && repoData[section][index]) {
                // Merge updates
                repoData[section][index] = { ...repoData[section][index], ...data };
                writeRepositoryFile(repoData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                throw new Error('Repository not found');
            }
        } catch (e) {
            console.error(e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

const deleteRepositoryData = (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { id } = JSON.parse(body);
            const [section, indexStr] = id.split('-');
            const index = parseInt(indexStr);

            if (require.cache[require.resolve(repoFilePath)]) {
                delete require.cache[require.resolve(repoFilePath)];
            }
            const repoData = require(repoFilePath);
            
            if (repoData[section] && repoData[section][index]) {
                const item = repoData[section][index];
                
                // Delete folder if path exists
                if (item.path) {
                    const absPath = path.resolve(__dirname, '../', item.path);
                    if (fs.existsSync(absPath)) {
                        fs.rmSync(absPath, { recursive: true, force: true });
                    }
                }

                // Remove from array
                repoData[section].splice(index, 1);
                
                writeRepositoryFile(repoData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                throw new Error('Repository not found');
            }
        } catch (e) {
            console.error(e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
}

module.exports = {
    serveRepositoryData,
    updateRepositoryData,
    deleteRepositoryData
}