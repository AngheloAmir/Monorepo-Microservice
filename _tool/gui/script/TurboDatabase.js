window.TurboDatabase = {
    consoleInstance: null,
    currentRunId: null,
    socket: null,
    isRunning: false,
    
    init: function() {
        console.log('TurboDatabase initializing...');
        
        const container = document.getElementById('turbo-db-console-container');
        if (container) {
            if (window.ConsoleDiv) {
                 // Use Global Instance if exists (specific to DB)
                 if (!window.turboDbConsoleInstance) {
                     window.turboDbConsoleInstance = new window.ConsoleDiv(container);
                 } else {
                     // Re-attach to new DOM - similar logic to TurboControl
                     const oldInstance = window.turboDbConsoleInstance;
                     window.turboDbConsoleInstance = new window.ConsoleDiv(container);
                     window.turboDbConsoleInstance.rehydrate(oldInstance);
                 }
                 this.consoleInstance = window.turboDbConsoleInstance;
            } else {
                console.error("ConsoleDiv class not found");
                container.innerHTML = "<div class='text-red-500 p-4'>Error: Console Component missing</div>";
            }
        }
        
        if (!this.socket && window.io) {
            this.socket = window.io();
            this.socket.on('runcmd-log', (data) => {
                if (data.id === this.currentRunId) {
                    if (data.text.includes('::DONE::')) {
                        this.setNotRunning();
                    } else {
                        this.appendLog(data.text);
                    }
                }
            });
        }
    },

    setRunning: function() {
        this.isRunning = true;
        const btns = document.querySelectorAll('[onclick^="window.TurboDatabase"]');
        
        btns.forEach(b => {
            b.dataset.originalClass = b.className;
            b.classList.add('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
            b.onclick_save = b.onclick;
            b.onclick = null; 
        });
    },

    setNotRunning: function() {
        this.isRunning = false;
        const btns = document.querySelectorAll('[onclick^="window.TurboDatabase"]');
        btns.forEach(b => {
             // Re-enable disabled buttons
             b.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
             if(b.onclick_save) b.onclick = b.onclick_save;
        });
        
        this.appendLog('\n> Done.\n', true);
    },

    run: async function(task) {
        if(this.isRunning) return;
        this.executeRequest({ action: task });
    },
    
    executeRequest: async function(payload, lockUI = true) {
        if (this.consoleInstance) {
             this.consoleInstance.clear();
             const cmdLabel = payload.action ? `turbo run ${payload.action}` : (payload.manualCommand ? payload.manualCommand.join(' ') : 'Unknown');
             this.consoleInstance.log(`> Requesting: ${cmdLabel}\n`, true);
        }
        
        if (lockUI) {
            this.setRunning();
        }

        try {
            const res = await fetch('/api/runcmd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    directory: 'shared/models',
                    basecmd: 'npm',
                    cmd: ['run', payload.action]
                })
            });
            const data = await res.json();
            
            if (data.success) {
                this.currentRunId = data.runId;
                this.appendLog(`> Process ID: ${data.runId}\n`, true);
            } else {
                this.appendLog(`> Error starting process: ${data.error}\n`, true);
                if (lockUI) this.setNotRunning();
            }

        } catch (e) {
            this.appendLog(`> Network Error: ${e.message}\n`, true);
            if (lockUI) this.setNotRunning();
        }
    },
    
    appendLog: function(text, isSystem = false) {
        if (this.consoleInstance) {
            this.consoleInstance.log(text, isSystem);
        } 
    }
};
