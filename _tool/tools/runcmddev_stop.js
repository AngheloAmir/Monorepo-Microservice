const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { activeProcesses, safeEmit } = require('./runcmddev_shared');

async function stopDevCommand(res, { id, stopcmd, directory }) {
    const entry = activeProcesses.get(id);
    
    if (entry) {
        entry.shouldRun = false; 
        
        if (entry.child && entry.child.pid) {
            safeEmit(id, `> Terminating process tree for ${id}...\n`);
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', entry.child.pid, '/T', '/F']);
                } else {
                    process.kill(-entry.child.pid, 'SIGKILL');
                }
            } catch (e) {
                entry.child.kill('SIGKILL');
            }
        }
        activeProcesses.delete(id);
    }

    if (stopcmd && directory) {
        const rootDir = path.resolve(__dirname, '../../');
        const targetDir = path.join(rootDir, directory);
        if (fs.existsSync(targetDir)) {
            safeEmit(id, `> Running shutdown command: ${stopcmd}\n`);
            await new Promise(resolve => {
                const sc = spawn(stopcmd, { 
                    cwd: targetDir, 
                    shell: true, 
                    env: { ...process.env, CI: 'true' } 
                });
                
                sc.stdout.on('data', (d) => safeEmit(id, d.toString()));
                sc.stderr.on('data', (d) => safeEmit(id, d.toString()));

                sc.on('close', (code) => {
                    safeEmit(id, `> Shutdown command finished with code ${code}\n`);
                    resolve();
                });
                sc.on('error', (err) => {
                    safeEmit(id, `> Shutdown command error: ${err.message}\n`);
                    resolve();
                });
                setTimeout(() => {
                    safeEmit(id, `> Shutdown command timed out after 15s\n`);
                    if(sc.pid) {
                         try { process.kill(sc.pid); } catch(e){}
                    }
                    resolve();
                }, 15000); 
            });
        }
    }
    
    safeEmit(id, `> Process ${id} is stopped.\n`);
    
    // Return standard JSON success
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
}

module.exports = { stopDevCommand };
