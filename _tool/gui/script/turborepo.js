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

    setRunning: function() {
        this.isRunning = true;
        const btns = document.querySelectorAll('[onclick^="window.turbo"]');
        btns.forEach(b => {
             // Save original opacity if needed? CSS usually handles hover.
             // Just enforcing disabled look.
            b.dataset.originalClass = b.className;
            b.classList.add('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
            b.onclick_save = b.onclick;
            b.onclick = null; // Prevent header click events just in case
        });
    },

    setNotRunning: function() {
        this.isRunning = false;
        const btns = document.querySelectorAll('[onclick^="window.turbo"]');
        btns.forEach(b => {
             b.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
             if(b.onclick_save) b.onclick = b.onclick_save;
        });
        this.appendLog('\n> Done.\n', true);
    },

    run: async function(task) {
        if(this.isRunning) return;
        this.executeRequest({ action: task });
    },
    
    startCommand: async function(cmdArray) {
        if(this.isRunning) return;
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
