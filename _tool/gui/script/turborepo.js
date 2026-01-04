window.turbo = {
    outputDiv: null,
    currentRunId: null,
    socket: null,
    
    init: function() {
        console.log('Turbo initializing...');
        this.outputDiv = document.getElementById('turbo-output');
        
        if (!this.socket && window.io) {
            this.socket = window.io();
            this.socket.on('runcmd-log', (data) => {
                if (data.id === this.currentRunId) {
                    this.appendLog(data.text);
                }
            });
        }
        
        // Real workspace list from project structure
        this.renderWorkspaceList([
            // Frontend
            { name: 'MyReactApp', type: 'app', icon: 'fa-desktop' },
            
            // Backend
            { name: 'NodeJS', type: 'app', icon: 'fa-server' },
            { name: 'Socket', type: 'app', icon: 'fa-plug' },
            { name: 'Supabase', type: 'app', icon: 'fa-database' },

            // Shared Packages
            { name: 'components', type: 'package', icon: 'fa-puzzle-piece' },
            { name: 'config', type: 'package', icon: 'fa-cogs' },
            { name: 'models', type: 'package', icon: 'fa-layer-group' },
            { name: 'routes', type: 'package', icon: 'fa-route' },
            
            // Tooling
             { name: '_tool', type: 'config', icon: 'fa-tools' }
        ]); 
    },

    renderWorkspaceList: function(workspaces) {
        const list = document.getElementById('turbo-workspace-list');
        if (!list) return;
        list.innerHTML = workspaces.map(w => `
            <div class="px-3 py-2 bg-gray-800/50 rounded-lg text-gray-300 text-xs flex justify-between items-center group hover:bg-gray-800 transition-colors cursor-pointer" onclick="window.turbo.selectWorkspace('${w.name}')">
                <div class="flex items-center gap-2">
                    <i class="fas ${w.icon || (w.type === 'app' ? 'fa-rocket text-green-500' : 'fa-box text-blue-500')}"></i>
                    ${w.name}
                </div>
                <div class="opacity-0 group-hover:opacity-100 flex gap-2">
                     <button class="hover:text-white" title="Run Build" onclick="event.stopPropagation(); window.turbo.runScoped('build', '${w.name}')"><i class="fas fa-hammer"></i></button>
                     <button class="hover:text-white" title="Run Dev" onclick="event.stopPropagation(); window.turbo.runScoped('dev', '${w.name}')"><i class="fas fa-play"></i></button>
                </div>
            </div>
        `).join('');
    },
    
    selectWorkspace: function(name) {
        console.log("Selected workspace:", name);
    },

    run: async function(task) {
        this.startCommand(['turbo', 'run', task]);
    },
    
    runScoped: async function(task, scope) {
        this.startCommand(['turbo', 'run', task, '--filter', scope]);
    },
    
    startCommand: async function(cmdArray) {
        const output = document.getElementById('turbo-output');
        if (output) {
             output.innerHTML = ''; 
             this.appendLog(`> Executing: npx ${cmdArray.join(' ')}\n`, true);
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
        const output = document.getElementById('turbo-output');
        if (!output) return;
        
        let html = text;
        if (window.TerminalModal && window.TerminalModal.parseAnsi) {
             html = window.TerminalModal.parseAnsi(text);
        } else {
            // Basic fallback
            html = text.replace(/\n/g, '<br>');
        }
        
        const div = document.createElement('div');
        if (isSystem) div.classList.add('text-blue-400', 'font-bold', 'mb-2');
        else div.classList.add('whitespace-pre-wrap', 'break-all'); // Ensure wrapping
        
        div.innerHTML = html;
        output.appendChild(div);
        
        // Auto-scroll
        output.scrollTop = output.scrollHeight;
    }
};

// Re-init on navigation if needed, though PageLoader replaces content, 
// so this script might need to be re-run or re-called.
// Since it's in the global scope (if loaded via index.html), we rely on the page calling init.
// If loaded via page content, it executes immediately.
if (document.getElementById('turbo-output')) {
    window.turbo.init();
}
