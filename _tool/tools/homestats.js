const os = require('os');
const pidusage = require('pidusage');
const { getActiveProcessCount, getActiveProcesses } = require('./runcmddev');
const repositoryData = require('../tooldata/repository.js');

async function getStats() {
    // Calculate total repos
    let totalRepos = 0;
    Object.values(repositoryData).forEach(list => {
        if (Array.isArray(list)) totalRepos += list.length;
    });

    const activeCount = getActiveProcessCount();
    const activeProcs = getActiveProcesses();
    const mainProcessMem = process.memoryUsage().rss;

    // Collect PIDs of all spawned children
    const pids = [];
    activeProcs.forEach(entry => {
        if (entry.child && entry.child.pid) {
            pids.push(entry.child.pid);
        }
    });

    let childrenMem = 0;
    if (pids.length > 0) {
        try {
            const stats = await pidusage(pids); // Returns object { pid: { memory: bytes, ... } }
            // Some pids might fail or exit quickly, handle safely
            Object.values(stats).forEach(s => {
                if (s && s.memory) childrenMem += s.memory;
            });
        } catch (e) {
            // Some process might have exited between check and measurement
            // console.error('PID usage error', e);
        }
    }

    return {
        systemTotalMem: os.totalmem(),
        serverUsedMem: mainProcessMem + childrenMem, // Combined Tool + Children
        cpus: os.cpus().length,
        uptime: os.uptime(),
        repoCount: totalRepos,
        activeCount: activeCount
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
    }, 3000);

    // Cleanup on client disconnect
    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
}

module.exports = { streamSystemStatus };
