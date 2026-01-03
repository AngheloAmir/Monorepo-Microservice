const os = require('os');
const pidusage = require('pidusage');
const { getActiveProcessCount, getActiveProcesses } = require('./runcmddev');
const { getActiveJobs } = require('./runcmdjob');
const repositoryData = require('../tooldata/repository.js');

let peakMemory = 0;

async function getStats() {
    // Calculate total repos
    let totalRepos = 0;
    Object.values(repositoryData).forEach(list => {
        if (Array.isArray(list)) totalRepos += list.length;
    });

    const activeDevMap = getActiveProcesses();
    const activeJobMap = getActiveJobs();
    
    // Combined list of PIDs to query
    const pidsToQuery = [];
    const pidToInfo = new Map(); // pid -> { name, type, id }

    // 1. Dev Processes
    activeDevMap.forEach((entry, id) => {
        if (entry.child && entry.child.pid) {
            pidsToQuery.push(entry.child.pid);
            pidToInfo.set(entry.child.pid, { 
                name: `${entry.config.basecmd} ${entry.config.directory}`, 
                type: 'Service', 
                id 
            });
        }
    });

    // 2. Job Processes
    activeJobMap.forEach((entry, id) => {
        if (entry.child && entry.child.pid) {
            pidsToQuery.push(entry.child.pid);
            pidToInfo.set(entry.child.pid, { 
                name: `${entry.config.basecmd} ${entry.config.directory}`, 
                type: 'Job', 
                id 
            });
        }
    });

    const mainProcessMem = process.memoryUsage().rss;
    let childrenMem = 0;
    const processList = [];

    // Add Main Process to list
    processList.push({
        pid: process.pid,
        name: 'Tool Server',
        type: 'System',
        memory: mainProcessMem
    });

    if (pidsToQuery.length > 0) {
        try {
            const stats = await pidusage(pidsToQuery);
            Object.keys(stats).forEach(pidStr => {
                const s = stats[pidStr];
                const pid = parseInt(pidStr);
                if (s && s.memory) {
                    childrenMem += s.memory;
                    
                    const info = pidToInfo.get(pid);
                    if (info) {
                        processList.push({
                            pid: pid,
                            name: info.name,
                            type: info.type,
                            memory: s.memory
                        });
                    }
                }
            });
        } catch (e) {
            // silent fail
        }
    }

    const totalServerMem = mainProcessMem + childrenMem;
    if (totalServerMem > peakMemory) peakMemory = totalServerMem;

    return {
        systemTotalMem: os.totalmem(),
        serverUsedMem: totalServerMem, 
        peakMem: peakMemory,
        cpus: os.cpus().length,
        uptime: os.uptime(),
        repoCount: totalRepos,
        activeCount: activeDevMap.size + activeJobMap.size, // Total active things
        processes: processList
    };
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

module.exports = { streamSystemStatus };
