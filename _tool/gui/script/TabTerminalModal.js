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
        if(!this.container) return;
        if (this.container.classList.contains('h-48')) {
            this.container.classList.remove('h-48');
            this.container.classList.add('h-8');
            this.container.classList.add('terminal-minimized');
        } else {
            this.container.classList.add('h-48');
            this.container.classList.remove('h-8');
            this.container.classList.remove('terminal-minimized');
        }
        const icon = document.getElementById('terminal-toggle-icon');
        if(icon) {
            if (this.container.classList.contains('terminal-minimized')) {
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
        if (!headerContainer) return; // robustness check

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

        // Create Panel UI
        const panelsContainer = document.getElementById('terminal-panels-container');
        const panelEl = document.createElement('div');
        panelEl.className = 'w-full h-full p-2 overflow-y-auto font-mono text-xs text-gray-300 whitespace-pre-wrap hidden scrollbar-thin scrollbar-thumb-gray-700';
        panelsContainer.appendChild(panelEl);

        window.tabTerminalItems[id] = {
            data: repoData,
            tabElement: tabEl,
            panelElement: panelEl,
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
                // Scroll to bottom
                item.panelElement.scrollTop = item.panelElement.scrollHeight;
            } else {
                item.tabElement.classList.remove('active');
                item.panelElement.classList.add('hidden');
            }
        });

        // Hide empty state
        document.getElementById('terminal-empty-state').classList.add('hidden');
    },

    writeOnTerminal: function(id, text) {
        if (text.trim() === '::HEARTBEAT::') return;
        const item      = window.tabTerminalItems [id];
        const panel     = item.panelElement;

        if( !panel ) return;
        const formatted = window.TerminalModal ? window.TerminalModal.parseAnsi(text) : text;
        const span      = document.createElement('span');
        span.innerHTML  = formatted;
        panel.appendChild(span);
        if (window.tabTerminalActiveId === id) {
            panel.scrollTop = panel.scrollHeight;
        }

        const totalText = panel.innerText;
        if (totalText.length > 10000) {
            panel.innerText = totalText.slice(-10000);
        }
    },

    closeTab: async function(id, name, stopCmd, path) {
        const item = window.tabTerminalItems[id];

        try {
            const response = await fetch('/api/runcmddev', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id:         id,
                    name:       name,
                    stopcmd:    stopCmd,
                    directory:  path 
                })
            });

            const reader  = response.body.getReader();
            item.reader   = reader;
            const decoder = new TextDecoder("utf-8");
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                this.writeOnTerminal(id, chunk);
            }
        } catch(e) { 
            console.error(e);
        }   

        finally {
            if (item.reader) try { await item.reader.cancel(); } catch(e) {}
            item.tabElement.remove();
            item.panelElement.remove();
            delete window.tabTerminalItems[id];

            // Select another tab if needed
            const keys = Object.keys(window.tabTerminalItems);
            if (keys.length > 0) {
                this.selectTab(keys[keys.length - 1]);
            } else {
                this.activeId = null;
                document.getElementById('terminal-empty-state').classList.remove('hidden');
            }

        //enable the button==========
            window.updateCardState(id, false);
            window.enableBtnRepo(id);
        }
    },

    startProcess: async function(id, data) {
        const item = window.tabTerminalItems[id];
        this.writeOnTerminal(id, `> Starting ${data.startcmd} in ${data.path}...\n`);

        try {
            const payload = {
                id:         id,
                name:       data.name,
                directory:  data.path,
                basecmd:    data.startcmd.split(' ')[0], // Simplistic parsing
                cmd:        data.startcmd.split(' ').slice(1)
            };
            
            const response = await fetch('/api/runcmddev', {
                method:    'POST',
                headers:   { 'Content-Type': 'application/json' },
                body:      JSON.stringify(payload)
            });

            if(!response.ok) {
                const txt = await response.text();
                this.writeOnTerminal(id, `\nError starting process: ${txt}\n`);
                return;
            }

            const reader  = response.body.getReader();
            item.reader   = reader;
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                this.writeOnTerminal(id, chunk);
            }
            this.writeOnTerminal(id, '\n[Process Disconnected]\n');
        } catch (e) {
            this.writeOnTerminal(id, `\nInternal Error: ${e.message}\n`);
        }
    }
};
