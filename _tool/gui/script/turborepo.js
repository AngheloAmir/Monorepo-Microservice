window.turbo = {
    consoleInstance: null,
    currentRunId: null,
    socket: null,
    isRunning: false,
    
    init: function() {
        console.log('Turbo initializing...');
        
        const container = document.getElementById('turbo-console-container');
        if (container) {
            if (window.ConsoleDiv) {
                 this.consoleInstance = new window.ConsoleDiv(container);
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

    activeTask: null,

    setRunning: function() {
        this.isRunning = true;
        const btns = document.querySelectorAll('[onclick^="window.turbo"]');
        
        btns.forEach(b => {
             // If this is the DEV button, treat differently ONLY if activeTask is 'dev'
             const isDevBtn = b.getAttribute('onclick').includes("'dev'");
             
             if (isDevBtn && this.activeTask === 'dev') {
                 // Change to STOP mode
                 const titleEl = b.querySelector('h3');
                 const iconEl = b.querySelector('i');
                 
                 if(titleEl) {
                     b.dataset.orgTitle = titleEl.innerText;
                     titleEl.innerText = "Stop Develop";
                 }
                 if(iconEl) {
                     b.dataset.orgIcon = iconEl.className;
                     iconEl.className = "fas fa-stop text-xl w-6 h-6 flex items-center justify-center animate-pulse text-red-500";
                 }
                 // Do NOT disable pointer events
                 b.classList.add('border-red-500/50', 'bg-red-900/10');
             } else {
                b.dataset.originalClass = b.className;
                b.classList.add('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
                b.onclick_save = b.onclick;
                b.onclick = null; 
             }
        });
    },

    setNotRunning: function() {
        this.isRunning = false;
        const btns = document.querySelectorAll('[onclick^="window.turbo"]');
        btns.forEach(b => {
             const isDevBtn = b.getAttribute('onclick') && b.getAttribute('onclick').includes("'dev'");
             const wasStopMode = isDevBtn && this.activeTask === 'dev';

             if (wasStopMode) {
                 // Restore DEV button from STOP mode
                 const titleEl = b.querySelector('h3');
                 const iconEl = b.querySelector('i');
                 
                 if(titleEl && b.dataset.orgTitle) titleEl.innerText = b.dataset.orgTitle;
                 if(iconEl && b.dataset.orgIcon) iconEl.className = b.dataset.orgIcon;
                 
                 b.classList.remove('border-red-500/50', 'bg-red-900/10');
             } else {
                 // Re-enable disabled buttons (include Dev btn if it was simply disabled)
                 b.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
                 if(b.onclick_save) b.onclick = b.onclick_save;
             }
        });
        
        this.activeTask = null;
        this.appendLog('\n> Done.\n', true);
    },

    run: async function(task) {
        if(this.isRunning) {
            // Only allow stopping if we are running dev
            // But we need to check if the current running task IS dev
            // For now, if running, try to stop
            this.stop();
            return;
        }
        
        // Special UI handling for DEV
        if(task === 'dev') {
             const btn = document.querySelector('[onclick="window.turbo.run(\'dev\')"]');
             if(btn) {
                 // We don't disable THIS button, we change it
                 // But setRunning disables ALL buttons. We need to tweak setRunning.
             }
        }

        this.activeTask = task;
        this.executeRequest({ action: task });
    },

    stop: async function() {
        try {
            await fetch('/api/turborepo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });
            this.appendLog('> Stop requested...\n', true);
            
            // Force reset UI state after a short delay to ensure we are ready for next command
            // The backend is now forcibly resetting state too
            setTimeout(() => this.setNotRunning(), 1000);

        } catch(e) {
            this.appendLog(`> Error stopping: ${e.message}\n`, true);
        }
    },
    
    startCommand: async function(cmdArray) {
        if(this.isRunning) return;
        this.activeTask = cmdArray.includes('clean') ? 'clean' : 'manual';
        this.executeRequest({ manualCommand: cmdArray });
    },

    executeRequest: async function(payload) {
        if (this.consoleInstance) {
             this.consoleInstance.clear();
             const cmdLabel = payload.action ? `turbo run ${payload.action}` : (payload.manualCommand ? payload.manualCommand.join(' ') : 'Unknown');
             this.consoleInstance.log(`> Requesting: ${cmdLabel}\n`, true);
        }
        
        this.setRunning();

        try {
            const res = await fetch('/api/turborepo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.success) {
                this.currentRunId = data.runId;
                this.appendLog(`> Process ID: ${data.runId}\n`, true);
            } else {
                this.appendLog(`> Error starting process: ${data.error}\n`, true);
                this.setNotRunning(); // Re-enable if server rejected
            }

        } catch (e) {
            this.appendLog(`> Network Error: ${e.message}\n`, true);
            this.setNotRunning();
        }
    },
    
    appendLog: function(text, isSystem = false) {
        if (this.consoleInstance) {
            this.consoleInstance.log(text, isSystem);
        } 
    }
};

if (document.getElementById('turbo-console-container')) {
    window.turbo.init();
}
