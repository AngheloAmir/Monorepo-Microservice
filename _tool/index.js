const http     = require('http')
const path     = require('path');
const PORT     = process.env.PORT || 3200;
const { serveFile, serveGUIFile } = require('./tools/serveGUIFile');
const { serveRepositoryData }     = require('./tools/apiRespository');
const { generateTemplate }        = require('./tools/templateGenerator');
const { runCmdHandler }           = require('./tools/runcmd');
const { runCmdDevHandler }        = require('./tools/runcmddev');

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

    case '/api/crud':
      return serveRepositoryData(res, req, 'crud.js');

    case '/api/create-repository':
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const result = await generateTemplate(data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } catch (e) {
                    console.error('Error creating repository:', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                }
            });
            return;
        }
        break;

    case '/api/runcmd':
        return runCmdHandler(req, res);
        
    case '/api/repository/update':
        const { updateRepositoryData } = require('./tools/apiRespository');
        return updateRepositoryData(req, res);
    
    case '/api/repository/delete':
        const { deleteRepositoryData } = require('./tools/apiRespository');
        return deleteRepositoryData(req, res);

    case '/api/runcmddev':
        return runCmdDevHandler(req, res);

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
