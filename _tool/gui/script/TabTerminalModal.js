window.TabTerminal = {
    init: async function( targetContainer ) {
        if (!targetContainer) {
            console.error('TabTerminal: No target container for init');
            return;
        }

        if (window.tabTerminalContainer) {
            targetContainer.appendChild(window.tabTerminalContainer);
            return;
        }
        
        window.tabTerminalItems     = window.tabTerminalItems     || {};
        window.tabTerminalActiveId  = window.tabTerminalActiveId  || null;

        if(!window.tabTerminalContainer) {
            try {
                const res = await fetch('/gui/components/TabTerminalModal.html');
                if (res.ok) {
                    const html      = await res.text();
                    const div       = document.createElement('div');
                    div.innerHTML   = html;
                    const container = div.querySelector('#tab-terminal-container');
                    targetContainer.appendChild( container ); 
                    div.remove();

                    window.tabTerminalContainer = container;
                }
            } catch (e) {
                console.error('Failed to init tab terminal', e);
            }
        }
    },

    isRunning: function(id) {
        return !!window.tabTerminalItems[id];
    },

    toggleMinimize: function() {
        if(!this.container) return; // container undefined? this.container vs window.tabTerminalContainer
        // Fix usage of this.container vs window.tabTerminalContainer
        const container = window.tabTerminalContainer; 
        if (!container) return;

        if (container.classList.contains('h-48')) {
            container.classList.remove('h-48');
            container.classList.add('h-8');
            container.classList.add('terminal-minimized');
        } else {
            container.classList.add('h-48');
            container.classList.remove('h-8');
            container.classList.remove('terminal-minimized');
        }
        const icon = document.getElementById('terminal-toggle-icon');
        if(icon) {
            if (container.classList.contains('terminal-minimized')) {
                icon.className = 'fas fa-chevron-up text-xs';
            } else {
                icon.className = 'fas fa-chevron-down text-xs';
            }
        }
    },

    show: function() {
        if( window.tabTerminalContainer ) {
            window.tabTerminalContainer.classList.remove('hidden');
        }
    },

    hide: function() {
        if (window.tabTerminalContainer) { 
            window.tabTerminalContainer.classList.add('hidden');
        }
    },

    createTab: async function(id, repoData) {
        if (!window.tabTerminalContainer) {
            console.warn('TabTerminal not initialized. Cannot create tab.');
            return;
        }
        this.show();

        if ( window.tabTerminalItems[id] ) {
            this.selectTab(id);
            return;
        }

        // Create Tab UI
        const headerContainer = document.getElementById('terminal-tabs-header');
        if (!headerContainer) return; 

        const tabEl = document.createElement('div');
        tabEl.className = 'w-[150px] px-1 border border-gray-700 rounded flex tab-item group transition-colors';
        tabEl.innerHTML = `
            <div class="flex items-center gap-2 flex-1 min-w-0">
                <i class="${repoData.icon || 'fas fa-terminal'} text-[18px] flex-shrink-0"></i>
                <span class="truncate font-medium text-[16px]">${repoData.name}</span>
            </div>
            <i class="fas fa-times tab-close opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-all text-[16px] flex-shrink-0 ml-1" title="Stop & Close"></i>
        `;
        
        // Bind click to select
        tabEl.onclick = (e) => {
            if(!e.target.classList.contains('tab-close')) {
                this.selectTab(id);
            }
        };

        // Bind click to close
        tabEl.querySelector('.tab-close').onclick = (e) => {
            e.stopPropagation();
            this.closeTab(id, repoData.name, repoData.stopcmd, repoData.path);
        };

        headerContainer.appendChild(tabEl);

        // Create Panel UI (Using ConsoleDiv)
        const panelsContainer = document.getElementById('terminal-panels-container');
        const panelEl = document.createElement('div');
        // The panel is just a container for ConsoleDiv to live in.
        // It must be full height relative to panelsContainer which is h-full.
        panelEl.className = 'w-full h-full hidden';
        panelsContainer.appendChild(panelEl);

        // Instantiate ConsoleDiv
        let consoleInstance = null;
        if (window.ConsoleDiv) {
            consoleInstance = new window.ConsoleDiv(panelEl);
        } else {
            console.error('ConsoleDiv not found. Ensure ConsoleDiv.js is loaded.');
            panelEl.innerHTML = '<div class="text-red-500">Error: Console Component Missing</div>';
        }

        window.tabTerminalItems[id] = {
            data: repoData,
            tabElement: tabEl,
            panelElement: panelEl,
            consoleInstance: consoleInstance,
            reader: null
        };

        this.selectTab(id);
        this.startProcess(id, repoData);
    },

    selectTab: function(id) {
        window.tabTerminalActiveId = id;
        
        // Update Tabs
        Object.keys(window.tabTerminalItems).forEach(key => {
            const item = window.tabTerminalItems[key];
            if (key === id) {
                item.tabElement.classList.add('active');
                item.panelElement.classList.remove('hidden');
                // Scroll to bottom just in case
                if(item.consoleInstance) item.consoleInstance.scrollToBottom();
            } else {
                item.tabElement.classList.remove('active');
                item.panelElement.classList.add('hidden');
            }
        });

        // Hide empty state
        document.getElementById('terminal-empty-state').classList.add('hidden');
    },

    writeOnTerminal: function(id, text) {
        try{
            if (text.trim() === '::HEARTBEAT::') return;
            const item = window.tabTerminalItems[id];
            if(!item) return;

            if (item.consoleInstance) {
                item.consoleInstance.log(text);
            } else {
                // Fallback (should not happen if ConsoleDiv loaded)
                console.log(`[Term ${id}]:`, text);
            }
        }
        catch (error) {
            console.error('Error writing to terminal:', error);
        }
    },

    initSocket: function() {
        if (window.repoSocket) return;
        
        // Initialize Socket.io connection
        window.repoSocket = io();
        
        window.repoSocket.on('connect', () => {
             // Re-join channels on reconnect
            if (window.tabTerminalItems) {
                Object.keys(window.tabTerminalItems).forEach(id => {
                    window.repoSocket.emit('join-log', id);
                });
            }
        });

        window.repoSocket.on('log', (data) => {
             if (data && data.id && data.text) {
                 this.writeOnTerminal(data.id, data.text);
             }
        });
    },

    closeTab: async function(id, name, stopCmd, path) {
        const item = window.tabTerminalItems[id];
        if(!item) return;

        try {
            // Just send the stop command, logs will come via socket
            await fetch('/api/runcmddev', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id:         id,
                    name:       name,
                    stopcmd:    stopCmd,
                    directory:  path 
                })
            });
            
            // Wait a moment for final logs
            await new Promise(r => setTimeout(r, 1000));
            
        } catch(e) { 
            console.error(e);
        }   

        finally {
            if (item.reader) try { await item.reader.cancel(); } catch(e) {}
            item.tabElement.remove();
            item.panelElement.remove();
            
            // Explicitly clear refs
            item.consoleInstance = null;
            
            delete window.tabTerminalItems[id];

            // Select another tab if needed
            const keys = Object.keys(window.tabTerminalItems);
            if (keys.length > 0) {
                this.selectTab(keys[keys.length - 1]);
            } else {
                window.tabTerminalActiveId = null;
                document.getElementById('terminal-empty-state').classList.remove('hidden');
            }

            //enable the button
            if(window.updateCardState) window.updateCardState(id, false);
            if(window.enableBtnRepo) window.enableBtnRepo(id);
        }
    },

    startProcess: async function(id, data) {
        // this.writeOnTerminal(id, `> Starting ${data.startcmd} in ${data.path}...\n`, true); // Removed per user request

        // Ensure socket is ready and join channel immediately
        this.initSocket(); 
        window.repoSocket.emit('join-log', id);

        try {
            const payload = {
                id:         id,
                name:       data.name,
                directory:  data.path,
                basecmd:    data.startcmd.split(' ')[0], 
                cmd:        data.startcmd.split(' ').slice(1),
                runBy:      data.runBy || '' // Added runBy to payload
            };
            
            const response = await fetch('/api/runcmddev', {
                method:    'POST',
                headers:   { 'Content-Type': 'application/json' },
                body:      JSON.stringify(payload)
            });

            if(!response.ok) {
                const json = await response.json();
                this.writeOnTerminal(id, `\nError starting process: ${json.error || 'Unknown'}\n`, true);
                return;
            }
            // Success - logs will arrive via socket
            
        } catch (e) {
            this.writeOnTerminal(id, `\n\n[ERROR] Network or Server Failure\n`, true);
            this.writeOnTerminal(id, `\n${e.message}\n`, true);
        }
    }
};
