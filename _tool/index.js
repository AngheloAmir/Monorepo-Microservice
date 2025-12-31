const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const PORT     = process.env.PORT || 3200;
const GUI_PATH = path.join(__dirname, 'gui');

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

const serveFile = (res, filePath) => {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
      res.end(content, 'utf-8');
    }
  });
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url;

  if (url === '/' || url === '/index.html') {
    serveFile(res, path.join(GUI_PATH, 'index.html'));
    return;
  }

  if (url === '/api/repository') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    // Reload the module to ensure fresh data if it changes (optional, good for dev tools)
    delete require.cache[require.resolve('./tooldata/repository.js')];
    const repoData = require('./tooldata/repository.js');
    res.end(JSON.stringify(repoData));
    return;
  }

  if (url === '/api/repotemplate') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    delete require.cache[require.resolve('./tooldata/repotemplate.js')];
    const data = require('./tooldata/repotemplate.js');
    res.end(JSON.stringify(data));
    return;
  }

  if (url.startsWith('/gui/')) {
    const relativePath = url.slice(5);
    // basic directory traversal prevention
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    serveFile(res, path.join(GUI_PATH, safePath));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});