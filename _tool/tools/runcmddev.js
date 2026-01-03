const { initSocket, activeProcesses } = require('./runcmddev_shared');
const { startDevCommand } = require('./runcmddev_start');
const { stopDevCommand } = require('./runcmddev_stop');


function runCmdDevHandler(req, res) {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                startDevCommand(res, data);
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else if (req.method === 'DELETE') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                await stopDevCommand(res, data);
            } catch (e) {
                res.writeHead(400).end();
            }
        });
    }
}

function getActiveProcesses() { return activeProcesses; }
function getActiveProcessCount() { return activeProcesses.size; }

module.exports = { runCmdDevHandler, getActiveProcessCount, getActiveProcesses, initSocket };
