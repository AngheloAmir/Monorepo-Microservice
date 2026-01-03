const { execSync, spawn } = require('child_process');

/**
 * Global store for active processes
 * Map<id, { child: ChildProcess, config: object, shouldRun: boolean, restartCount: number }>
 */
const activeProcesses = new Map();
let io = null;

function initSocket(socketIo) {
    io = socketIo;
    io.on('connection', (socket) => {
        socket.on('join-log', (id) => {
            socket.join(id);
            if(activeProcesses.has(id)) {
                 socket.emit('log', { id, text: `::ATTACHED:: Process ${id} is running.\n` });
            }
        });
    });
}

function getIO() {
    return io;
}

function safeEmit(id, text) {
    if(io) io.to(id).emit('log', { id, text });
}

/**
 * Checks if the system has the required binary (docker, npm, etc.)
 */
function isCommandAvailable(cmd) {
    try {
        const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
        execSync(checkCmd, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Handle server shutdown: Kill all managed children so they don't become zombies
 */
process.on('exit', () => {
    for (const [id, entry] of activeProcesses) {
        if (entry.child && entry.child.pid) {
            try {
                const pid = entry.child.pid;
                process.platform === 'win32' ? spawn('taskkill', ['/pid', pid, '/T', '/F']) : process.kill(-pid);
            } catch (e) {}
        }
    }
});

module.exports = {
    activeProcesses,
    initSocket,
    getIO,
    safeEmit,
    isCommandAvailable
};
