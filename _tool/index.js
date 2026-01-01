const http     = require('http')
const path     = require('path');
const PORT     = process.env.PORT || 3200;
const { serveFile, serveGUIFile } = require('./tools/serveGUIFile');
const { serveRepositoryData }     = require('./tools/apiRespository');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  switch( req.url ) {
    case '/':
    case '/index.html':
      return serveGUIFile(req, res);
    case '/api/repository':
      return serveRepositoryData(res, req, 'repository.js');
    case '/api/repotemplate':
      return serveRepositoryData(res, req, 'repotemplate.js');

    default:
      if (req.url.startsWith('/gui/')) {
        const relativePath = req.url.slice(5);
        const safePath     = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
        serveFile(res, safePath);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
