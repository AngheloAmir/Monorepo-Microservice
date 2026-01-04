window.turbo = {
    consoleInstance: null,
    currentRunId: null,
    socket: null,
    
    init: function() {
        console.log('Turbo initializing...');
        
        const container = document.getElementById('turbo-console-container');
        if (container) {
            if (window.ConsoleDiv) {
                 // Ensure single instance if init called multiple times?
                 // Usually navigating away destroys the DOM element, so we create new one.
                 this.consoleInstance = new window.ConsoleDiv(container);
                 
                 // Wait for ready? ConsoleDiv init is async but it sets isReady.
                 // We can start using it immediately, it handles buffering or methods exist.
            } else {
                console.error("ConsoleDiv class not found");
                container.innerHTML = "<div class='text-red-500 p-4'>Error: Console Component missing</div>";
            }
        }
        
        if (!this.socket && window.io) {
            this.socket = window.io();
            this.socket.on('runcmd-log', (data) => {
                if (data.id === this.currentRunId) {
                    this.appendLog(data.text);
                }
            });
        }
    },

    run: async function(task) {
        this.startCommand(['turbo', 'run', task]);
    },
    
    startCommand: async function(cmdArray) {
        if (this.consoleInstance) {
             this.consoleInstance.clear();
             this.consoleInstance.log(`> Executing: npx ${cmdArray.join(' ')}\n`, true);
        }
        
        try {
            const res = await fetch('/api/runcmd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    directory: '.', 
                    basecmd: 'npx', 
                    cmd: cmdArray 
                })
            });
            const data = await res.json();
            
            if (data.success) {
                this.currentRunId = data.runId;
                this.appendLog(`> Process ID: ${data.runId}\n`, true);
            } else {
                this.appendLog(`> Error starting process: ${data.error}\n`, true);
            }

        } catch (e) {
            this.appendLog(`> Network Error: ${e.message}\n`, true);
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
