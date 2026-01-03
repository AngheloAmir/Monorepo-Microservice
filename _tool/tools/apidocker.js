const { exec } = require('child_process');

// Helper to parse memory string to bytes
function parseMemory(memStr) {
    const units = {
        'B': 1, 'b': 1,
        'kB': 1000, 'KB': 1000, 'KiB': 1024,
        'mB': 1000*1000, 'MB': 1000*1000, 'MiB': 1024*1024,
        'gB': 1000*1000*1000, 'GB': 1000*1000*1000, 'GiB': 1024*1024*1024
    };
    const match = memStr.match(/^([0-9.]+)([a-zA-Z]+)$/);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = match[2];
    return val * (units[unit] || 1);
}

// Helper to get docker containers and usage
function getDockerContainers() {
    return new Promise((resolve) => {
        exec('docker ps --format "{{.ID}}|{{.Image}}|{{.Status}}|{{.Names}}"', (err, stdout) => {
            if (err) return resolve({ containers: [], totalMem: 0 });
            
            const lines = stdout.trim().split('\n');
            if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
                return resolve({ containers: [], totalMem: 0 });
            }

            const containers = lines.map(line => {
                const parts = line.split('|');
                return {
                    id: parts[0],
                    image: parts[1],
                    status: parts[2],
                    name: parts[3],
                    memoryStr: '0B',
                    memoryBytes: 0
                };
            });

            // Get stats
            exec('docker stats --no-stream --format "{{.ID}}|{{.MemUsage}}"', (err2, stdout2) => {
                let totalMem = 0;
                if (!err2) {
                    const statLines = stdout2.trim().split('\n');
                    const statMap = {};
                    statLines.forEach(l => {
                        const parts = l.split('|');
                        if (parts.length >= 2) {
                            // "12.5MiB / 1.95GiB" -> take "12.5MiB"
                            const usageStr = parts[1].split('/')[0].trim();
                            statMap[parts[0]] = usageStr;
                        }
                    });

                    containers.forEach(c => {
                        // Match by ID
                        if (statMap[c.id]) {
                            c.memoryStr = statMap[c.id];
                            c.memoryBytes = parseMemory(c.memoryStr);
                            totalMem += c.memoryBytes;
                        }
                    });
                }
                resolve({ containers, totalMem });
            });
        });
    });
}

function stopContainer(id) {
    return new Promise((resolve) => {
         exec(`docker stop ${id}`, (err) => {
             if (err) return resolve({ success: false, error: err.message });
             resolve({ success: true });
         });
    });
}

function stopAllContainers() {
    return new Promise((resolve) => {
         // Stop only running containers
         exec('docker stop $(docker ps -q)', (err) => {
             // If no containers are running, docker stop might error with "requires at least 1 argument"
             // or docker ps -q returns empty.
             if (err) {
                 // Check if it's just because empty
                 if (err.message.includes('docker stop') && err.message.includes('requires at least 1 argument')) {
                     return resolve({ success: true, message: 'No containers to stop' });
                 }
                 // If docker ps failed or other error
                 return resolve({ success: false, error: err.message });
             }
             resolve({ success: true });
         });
    });
}

// Handler for API requests
async function handleDockerRequest(req, res) {
    if (req.method === 'POST') {
        const url = req.url;
        
        let body = '';
        req.on('data', chunk => body += chunk);
        
        req.on('end', async () => {
             if (url === '/api/docker/stop') {
                 try {
                     const { id } = JSON.parse(body);
                     if (!id) throw new Error('ID required');
                     const result = await stopContainer(id);
                     res.writeHead(200, { 'Content-Type': 'application/json' });
                     res.end(JSON.stringify(result));
                 } catch(e) {
                     res.writeHead(400, { 'Content-Type': 'application/json' });
                     res.end(JSON.stringify({ success: false, error: e.message }));
                 }
                 return;
             }
             
             if (url === '/api/docker/stop-all') {
                  const result = await stopAllContainers();
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result));
                  return;
             }
             
             res.writeHead(404);
             res.end();
        });
    } else {
        res.writeHead(405);
        res.end();
    }
}

module.exports = { getDockerContainers, handleDockerRequest };
