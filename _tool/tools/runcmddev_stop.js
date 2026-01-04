const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { activeProcesses, safeEmit } = require('./runcmddev_shared');

async function stopDevCommand(res, { id, stopcmd, directory }) {
    const entry = activeProcesses.get(id);
    
    if (entry) {
        entry.shouldRun = false; 
        
        if (entry.child && entry.child.pid) {
            safeEmit(id, chalk.green(`[System] Terminating process tree for ${id}...`));
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
            safeEmit(id, chalk.green(`[System] Running shutdown command: ${stopcmd}`));
            await new Promise(resolve => {
                const sc = spawn(stopcmd, { 
                    cwd: targetDir, 
                    shell: true, 
                    env: { ...process.env, CI: 'true' } 
                });
                
                sc.stdout.on('data', (d) => safeEmit(id, d.toString()));
                sc.stderr.on('data', (d) => safeEmit(id, d.toString()));

                sc.on('close', (code) => {
                    safeEmit(id, chalk.green(`[System] Shutdown command finished with code ${code}`));
                    resolve();
                });
                sc.on('error', (err) => {
                    safeEmit(id, chalk.red(`[System] Shutdown command error: ${err.message}`));
                    resolve();
                });
            });
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    safeEmit(id, chalk.green(`[System] Process ${id} is stopped.`));
    
    // Return standard JSON success
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
}

module.exports = { stopDevCommand };
