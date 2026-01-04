const os = require('os');
const pidusage = require('pidusage');
const { getActiveProcessCount, getActiveProcesses } = require('./runcmddev');
const { getActiveJobs } = require('./runcmdjob');
const workSpaceData = require('../tooldata/Workspace.js');
const { getDockerContainers } = require('./apidocker');

let peakMemory = 0;

// Helper to get all processes and build a parent-child map
function getProcessTree() {
    return new Promise((resolve) => {
        // ps -A -o pid,ppid returns all processes. 
        exec('ps -A -o pid,ppid', (err, stdout) => {
            if (err) return resolve(new Map()); // Fail safe

            const parentMap = new Map(); // ppid -> [pid, pid]
            const lines = stdout.trim().split('\n');
            // Skip header (PID PPID)
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].trim().split(/\s+/);
                // parts might have empty strings if spaces handled poorly, but regex split handles it
                if (parts.length >= 2) {
                    const pid = parseInt(parts[0]);
                    const ppid = parseInt(parts[1]);
                    if (!isNaN(pid) && !isNaN(ppid)) {
                        if (!parentMap.has(ppid)) parentMap.set(ppid, []);
                        parentMap.get(ppid).push(pid);
                    }
                }
            }
            resolve(parentMap);
        });
    });
}

// Recursively find all descendants
function getAllDescendants(rootPid, parentMap) {
    const results = [rootPid];
    const queue = [rootPid];
    
    while (queue.length > 0) {
        const current = queue.shift();
        const children = parentMap.get(current);
        if (children) {
            children.forEach(child => {
                results.push(child);
                queue.push(child);
            });
        }
    }
    return results;
}

async function getStats() {
    // Calculate total repos
    let totalRepos = 0;
    Object.values(workSpaceData).forEach(list => {
        if (Array.isArray(list)) totalRepos += list.length;
    });

    const activeDevMap = getActiveProcesses();
    const activeJobMap = getActiveJobs();
    
    // 1. Build Process Tree Map (One generic PS call)
    const parentMap = await getProcessTree();
    const dockerData = await getDockerContainers();
    
    // 2. Resolve Service Groups (Service ID -> List of PIDs)
    const distinctPids = [];
    const serviceGroups = []; // { name, type, pids: [] }

    // Helper to add group
    const addGroup = (entry, type) => {
        if (!entry.child || !entry.child.pid) return;
        const rootPid = entry.child.pid;
        const children = getAllDescendants(rootPid, parentMap);
        
        children.forEach(p => distinctPids.push(p));
        
        serviceGroups.push({
            name: `${entry.config.basecmd} ${entry.config.directory}`,
            type: type,
            rootPid: rootPid,
            pids: children
        });
    };

    activeDevMap.forEach((entry) => addGroup(entry, 'Service'));
    activeJobMap.forEach((entry) => addGroup(entry, 'Job'));
    
    // Also track the Main Tool process (and its children/workers if any)
    const mainPid = process.pid;
    const mainChildren = getAllDescendants(mainPid, parentMap);
    mainChildren.forEach(p => distinctPids.push(p));

    // 3. PidUsage Query
    const processList = [];
    let mainToolMem = 0;

    // We only query if we have PIDs
    if (distinctPids.length > 0) {
        try {
            // pidusage handles duplicates gracefully usually, but Set is safer
            const uniquePids = [...new Set(distinctPids)];
            const stats = await pidusage(uniquePids);
            
            // A. Aggregate Services
            serviceGroups.forEach(group => {
                let total = 0;
                group.pids.forEach(pid => {
                    if (stats[pid] && stats[pid].memory) total += stats[pid].memory;
                });
                
                processList.push({
                    pid: group.rootPid,
                    name: group.name,
                    type: group.type,
                    memory: total
                });
            });

            // B. Aggregate Main Tool
            mainChildren.forEach(pid => {
               if (stats[pid] && stats[pid].memory) mainToolMem += stats[pid].memory;
            });

        } catch (e) {
            console.error('PidUsage Error:', e.message);
        }
    }

    // Add System Entry
    processList.push({
        pid: mainPid,
        name: 'Tool Server (Tree)',
        type: 'System',
        memory: mainToolMem || process.memoryUsage().rss
    });

    // Calculate Total Server Used
    let totalServerMem = processList.reduce((acc, curr) => acc + curr.memory, 0);

    if (totalServerMem > peakMemory) peakMemory = totalServerMem;

    return {
        systemTotalMem: os.totalmem(),
        serverUsedMem: totalServerMem, 
        peakMem: peakMemory,
        cpus: os.cpus().length,
        uptime: os.uptime(),
        repoCount: totalRepos,
        activeCount: activeDevMap.size + activeJobMap.size,
        processes: processList,
        dockerContainers: dockerData.containers,
        dockerTotalMem: dockerData.totalMem
    };
}



const { exec } = require('child_process');

function killPort(port) {
    return new Promise((resolve, reject) => {
        // Find PID occupying the port
        exec(`lsof -t -i:${port}`, (err, stdout) => {
            if (err) {
                // If lsof fails, it might mean no process is using the port or lsof is missing.
                // Try fuser as backup or just resolve false (nothing to kill)
                if (err.code === 1) return resolve(false); // No process found
                // return reject(err); 
                return resolve(false);
            }

            const pids = stdout.trim().split('\n').filter(p => p);
            if (pids.length === 0) return resolve(false);

            // Kill the PIDs
            const pidList = pids.join(' ');
            exec(`kill -9 ${pidList}`, (kErr) => {
                if (kErr) return reject(kErr);
                resolve(true);
            });
        });
    });
}

function handleKillPort(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const { port } = JSON.parse(body);
            if (!port) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Port required' }));
                return;
            }

            const killed = await killPort(port);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, killed }));
        } catch (e) {
            console.error('Kill Port Error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
}

function streamSystemStatus(req, res) {
    // Set headers for Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Send initial data immediately
    getStats().then(stats => {
        res.write(`data: ${JSON.stringify(stats)}\n\n`);
    });

    // Loop every 3 seconds
    const intervalId = setInterval(async () => {
        try {
            const stats = await getStats();
            res.write(`data: ${JSON.stringify(stats)}\n\n`);
        } catch(e) {
            console.error('Error streaming stats:', e);
        }
    }, 10000);

    // Cleanup on client disconnect
    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
}

module.exports = { streamSystemStatus, handleKillPort };
