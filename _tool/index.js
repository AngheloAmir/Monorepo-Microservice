const http     = require('http');
const path     = require('path');
const { Server } = require("socket.io"); // Import Socket.IO
const PORT     = process.env.PORT || 3200;
const { serveFile, serveGUIFile } = require('./tools/serveGUIFile');
const { serveWorkspaceData }     = require('./tools/apiWorkspace');
const { generateTemplate }        = require('./tools/templateGenerator');
const { runCmdHandler }           = require('./tools/runcmd');
const { runCmdDevHandler, initSocket } = require('./tools/runcmddev'); // Import initSocket
const internalCrudTester          = require('./tools/_internalCrudTester');

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
      
    case '/api/workspace':
      return serveWorkspaceData(res, req, 'Workspace.js');

    case '/api/repotemplate':
      return serveWorkspaceData(res, req, 'repotemplate.js');

    case '/api/crud':
      return serveWorkspaceData(res, req, 'crud.js');

    case '/api/create-workspace':
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
        
    case '/api/runcmdjob':
        const { runCmdJobHandler } = require('./tools/runcmdjob');
        return runCmdJobHandler(req, res);

    case '/api/workspace/update':
        const { updateWorkspaceData } = require('./tools/apiWorkspace');
        return updateWorkspaceData(req, res);
    
    case '/api/workspace/delete':
        const { deleteWorkspaceData } = require('./tools/apiWorkspace');
        return deleteWorkspaceData(req, res);

    case '/api/runcmddev':
        return runCmdDevHandler(req, res);

    case '/api/crudedit':
        const { saveCrudData } = require('./tools/apiCrud');
        return saveCrudData(req, res);

    case '/api/system-status':
        const { streamSystemStatus } = require('./tools/homestats');
        return streamSystemStatus(req, res);

    case '/api/kill-port':
        const { handleKillPort } = require('./tools/homestats');
        return handleKillPort(req, res);
    
    // Docker management routes
    case '/api/docker/stop':
    case '/api/docker/stop-all':
        const { handleDockerRequest } = require('./tools/apidocker');
        return handleDockerRequest(req, res);

    //internal CRUD testing routes===========================================
    case '/pingme':
       return internalCrudTester.pingMe(req, res);
    case '/pingpost':
       return internalCrudTester.pingPost(req, res);

    default:
      if (req.url.startsWith('/pingstream')) {
          return internalCrudTester.pingStream(req, res);
      }
      
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

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Pass IO to runCmdDev functionality
initSocket(io);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
