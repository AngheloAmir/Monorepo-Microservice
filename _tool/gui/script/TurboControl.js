window.TurboControl = {
    consoleInstance: null,
    currentRunId: null,
    socket: null,
    isRunning: false,
    
    init: function() {
        console.log('TurboControl initializing...');
        
        const container = document.getElementById('turbo-console-container');
        if (container) {
            if (window.ConsoleDiv) {
                 // Use Global Instance if exists
                 if (!window.turboConsoleInstance) {
                     window.turboConsoleInstance = new window.ConsoleDiv(container);
                 } else {
                     // Re-attach to new DOM
                     // ConsoleDiv usually keeps references to DOM elements in constructor.
                     // If we navigate away and back, the DOM is destroyed.
                     // We need to re-instantiate OR update the container reference.
                     // For simplicity, let's re-instantiate but try to keep history if possible? 
                     // ConsoleDiv Logic: this.container = container; 
                     // If ConsoleDiv keeps history in internal array, we could transfer it.
                     
                     // Assuming ConsoleDiv stores history in DOM, we lose it anyway on DOM destruction unless requested feature "persistent logs".
                     // BUT, if we just store the instance globally, it still refers to OLD DOM elements which are gone.
                     
                     // BETTER APPROACH:
                     // Create a new instance attached to the new Container...
                     // BUT copy the history from the old global instance (if any).
                     
                     // Create new instance but rehydrate from old one
                     const oldInstance = window.turboConsoleInstance;
                     window.turboConsoleInstance = new window.ConsoleDiv(container);
                     window.turboConsoleInstance.rehydrate(oldInstance);
                 }
                 this.consoleInstance = window.turboConsoleInstance;
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
        const btns = document.querySelectorAll('[onclick^="window.TurboControl"]');
        
        btns.forEach(b => {
            b.dataset.originalClass = b.className;
            b.classList.add('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
            b.onclick_save = b.onclick;
            b.onclick = null; 
        });
    },

    setNotRunning: function() {
        this.isRunning = false;
        const btns = document.querySelectorAll('[onclick^="window.TurboControl"]');
        btns.forEach(b => {
             // Re-enable disabled buttons
             b.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
             if(b.onclick_save) b.onclick = b.onclick_save;
        });
        
        this.appendLog('\n> Done.\n', true);
    },

    run: async function(task) {
        if(this.isRunning) return;
        
        if (task === 'summary') {
            this.executeRequest({ action: 'get-graph' });
        } else {
            this.executeRequest({ action: task });
        }
    },

    pruneDocker: async function() {
        if(this.isRunning) return;
        
        const scope = prompt("Enter the package name to prune (e.g., 'web' or 'api'):\nThis will create a partial monorepo in ./out directory.");
        if(!scope) return;
        
        this.executeRequest({ action: 'prune', scope: scope });
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
            

            if (data.graph) {
                // Handle Summary/Graph response
                this.consoleInstance.clear();
                this.consoleInstance.log('--- Turbo Summary (Simulated based on Graph) ---\n\n', true);
                
                const tasks = data.graph.tasks; 
                let totalTasks = 0;
                let potentialCache = 0;
                
                // Naive summary since we receive a static graph, not a run profile
                // But we can show what WOULD happen or structure
                
                for (const [taskId, details] of Object.entries(tasks)) {
                    totalTasks++;
                    if (details.cache) potentialCache++;
                    
                    // taskId is usually "package#task" e.g. "web#build"
                    // If it is an index, we try to find more info
                    let displayId = taskId;
                    if (details.package && details.task) {
                        displayId = `${details.package} -> ${details.task}`;
                    }

                    this.consoleInstance.log(`📦 ${displayId}\n`); // Use box emoji
                    
                    if(details.dependencies && details.dependencies.length > 0) {
                        this.consoleInstance.log(`   └─ Depends on: ${details.dependencies.join(', ')}\n`);
                    }
                    if (details.cache) {
                         this.consoleInstance.log(`   ⚡ Cacheable\n`);
                    }
                    this.consoleInstance.log('\n');
                }
                
                this.consoleInstance.log(`\n\nTotal Tasks Identified: ${totalTasks}\n`);
                this.consoleInstance.log(`Cacheable Tasks: ${potentialCache}\n`);
                
                this.setNotRunning();
                return;
            }

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
