const fs       = require('fs');
const path     = require('path');
const GUI_PATH = path.join(__dirname, '..', 'gui');

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

const serveFile = (res, filePathToGUI) => {
    const fileRequestDir  = path.join(GUI_PATH, filePathToGUI);
    fs.readFile(fileRequestDir, (err, content) => {
        if (err) {
        if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`Server Error: ${err.code}`);
        }
        } else {
        res.writeHead(200, { 'Content-Type': getMimeType(fileRequestDir) });
        res.end(content, 'utf-8');
        }
    });
};

const serveGUIFile = (req, res) => {
  serveFile(res, 'index.html');
};

module.exports = {
  serveFile,
  serveGUIFile,
};