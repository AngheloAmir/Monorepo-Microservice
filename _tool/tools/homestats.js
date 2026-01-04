const os = require('os');
const fs = require('fs');
const pidusage = require('pidusage');
const { exec } = require('child_process');

const { getActiveProcessCount, getActiveProcesses } = require('./runcmddev');
const { getActiveJobs } = require('./runcmdjob');
const workSpaceData = require('../tooldata/Workspace.js');
const { getDockerContainers } = require('./apidocker');

let peakMemory = 0;

/* ============================================================
   🔥 Linux-correct memory reading (PSS)
   ============================================================ */

function getPSS(pid) {
    try {
        const data = fs.readFileSync(`/proc/${pid}/smaps_rollup`, "utf8");
        const match = data.match(/^Pss:\s+(\d+)\s+kB/m);
        if (!match) return 0;
        return parseInt(match[1], 10) * 1024; // bytes
    } catch {
        return 0;
    }
}

/* ============================================================
   Process Tree Builder
   ============================================================ */

function getProcessTree() {
    return new Promise((resolve) => {
        exec('ps -A -o pid,ppid', (err, stdout) => {
            if (err) return resolve(new Map());

            const parentMap = new Map();
            const lines = stdout.trim().split('\n');

            for (let i = 1; i < lines.length; i++) {
                const [pid, ppid] = lines[i].trim().split(/\s+/).map(Number);
                if (!isNaN(pid) && !isNaN(ppid)) {
                    if (!parentMap.has(ppid)) parentMap.set(ppid, []);
                    parentMap.get(ppid).push(pid);
                }
            }
            resolve(parentMap);
        });
    });
}

function getAllDescendants(rootPid, parentMap) {
    const results = [rootPid];
    const queue = [rootPid];

    while (queue.length) {
        const current = queue.shift();
        const children = parentMap.get(current);
        if (children) {
            for (const child of children) {
                results.push(child);
                queue.push(child);
            }
        }
    }
    return results;
}

/* ============================================================
   Main Stats Collector
   ============================================================ */

async function getStats() {
    // Count repos
    let totalRepos = 0;
    Object.values(workSpaceData).forEach(list => {
        if (Array.isArray(list)) totalRepos += list.length;
    });

    const activeDevMap = getActiveProcesses();
    const activeJobMap = getActiveJobs();

    const parentMap = await getProcessTree();
    const dockerData = await getDockerContainers();

    const distinctPids = [];
    const serviceGroups = [];

    function addGroup(entry, type) {
        if (!entry.child || !entry.child.pid) return;
        const rootPid = entry.child.pid;
        const children = getAllDescendants(rootPid, parentMap);

        children.forEach(p => distinctPids.push(p));

        serviceGroups.push({
            name: `${entry.config.basecmd} ${entry.config.directory}`,
            type,
            rootPid,
            pids: children
        });
    }

    activeDevMap.forEach(e => addGroup(e, 'Service'));
    activeJobMap.forEach(e => addGroup(e, 'Job'));

    const mainPid = process.pid;
    const mainChildren = getAllDescendants(mainPid, parentMap);
    mainChildren.forEach(p => distinctPids.push(p));

    const processList = [];
    let mainToolMem = 0;

    if (distinctPids.length) {
        try {
            const uniquePids = [...new Set(distinctPids)];
            await pidusage(uniquePids); // only to validate alive pids

            // --- Aggregate services using PSS ---
            for (const group of serviceGroups) {
                let total = 0;
                for (const pid of group.pids) {
                    total += getPSS(pid);
                }

                processList.push({
                    pid: group.rootPid,
                    name: group.name,
                    type: group.type,
                    memory: total
                });
            }

            // --- Main Tool ---
            for (const pid of mainChildren) {
                mainToolMem += getPSS(pid);
            }

        } catch (e) {
            console.error('Pid scan error:', e.message);
        }
    }

    processList.push({
        pid: mainPid,
        name: 'Tool Server (Tree)',
        type: 'System',
        memory: mainToolMem || process.memoryUsage().rss
    });

    const totalServerMem = processList.reduce((a, b) => a + b.memory, 0);
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

/* ============================================================
   Kill Port
   ============================================================ */

function killPort(port) {
    return new Promise((resolve) => {
        exec(`lsof -t -i:${port}`, (err, stdout) => {
            if (err || !stdout.trim()) return resolve(false);

            exec(`kill -9 ${stdout.trim().split('\n').join(' ')}`, () => {
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
            const killed = await killPort(port);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, killed }));
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
        }
    });
}

/* ============================================================
   Streaming SSE
   ============================================================ */

function streamSystemStatus(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    const send = async () => {
        try {
            const stats = await getStats();
            res.write(`data: ${JSON.stringify(stats)}\n\n`);
        } catch (e) {
            console.error('Stream error', e);
        }
    };

    send();
    const interval = setInterval(send, 10000);

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
}

module.exports = { streamSystemStatus, handleKillPort };
