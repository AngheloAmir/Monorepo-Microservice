window.TabTerminal = {
    container: null,
    items: {}, // { id: { name, type, element, panelElement, reader, active: bool } }
    activeId: null,

    init: async function(targetContainer) {
        if (!targetContainer) {
             console.error('TabTerminal: No target container for init');
             return;
        }

        // Use existing container if available (Persistence)
        if (this.container) {
            targetContainer.appendChild(this.container);
            return;
        }
        
        // Only reset if truly starting fresh (which shouldn't happen often with single page nav)
        this.items = this.items || {};
        this.activeId = null;

        try {
            const res = await fetch('/gui/components/TabTerminalModal.html');
            if (res.ok) {
                const html = await res.text();
                const div = document.createElement('div');
                div.innerHTML = html;
                
                // Unwrap
                const container = div.querySelector('#tab-terminal-container');
                targetContainer.appendChild(container); // Mount to new parent
                div.remove();

                this.container = container;
            }
        } catch (e) {
            console.error('Failed to init tab terminal', e);
        }
    },

    isRunning: function(id) {
        return !!this.items[id];
    },

    toggleMinimize: function() {
        if(!this.container) return;
        
        // Swap height classes for cleaner Tailwind control
        if (this.container.classList.contains('h-64')) {
            this.container.classList.remove('h-64');
            this.container.classList.add('h-10');
            this.container.classList.add('terminal-minimized'); // Keep for state tracking
        } else {
            this.container.classList.add('h-64');
            this.container.classList.remove('h-10');
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
        if (this.container) {
            // this.container.classList.remove('translate-y-full'); // Removed transition logic for static placement
            this.container.classList.remove('hidden');
        }
    },

    hide: function() {
        if (this.container) {
            // this.container.classList.add('translate-y-full');
            this.container.classList.add('hidden');
        }
    },

    createTab: async function(repoData) {
        if (!this.container) {
            console.warn('TabTerminal not initialized. Cannot create tab.');
            return;
        }
        this.show();

        const id = repoData.name;
        
        // If exists, just select it
        if (this.items[id]) {
            this.selectTab(id);
            return;
        }

        // Create Tab UI
        const headerContainer = document.getElementById('terminal-tabs-header');
        if (!headerContainer) return; // robustness check

        const tabEl = document.createElement('div');
        tabEl.className = 'tab-item group transition-colors';
        tabEl.innerHTML = `
            <div class="flex items-center gap-2 flex-1 min-w-0">
                <i class="${repoData.icon || 'fas fa-terminal'} text-[10px] flex-shrink-0"></i>
                <span class="truncate font-medium text-[10px]">${repoData.name}</span>
            </div>
            <i class="fas fa-times tab-close opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-all text-[10px] flex-shrink-0 ml-1" title="Stop & Close"></i>
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
            this.closeTab(id, repoData.stopcmd, repoData.path);
        };

        headerContainer.appendChild(tabEl);

        // Create Panel UI
        const panelsContainer = document.getElementById('terminal-panels-container');
        const panelEl = document.createElement('div');
        panelEl.className = 'w-full h-full p-2 overflow-y-auto font-mono text-xs text-gray-300 whitespace-pre-wrap hidden scrollbar-thin scrollbar-thumb-gray-700';
        panelsContainer.appendChild(panelEl);

        this.items[id] = {
            data: repoData,
            tabElement: tabEl,
            panelElement: panelEl,
            reader: null
        };

        this.selectTab(id);
        this.startProcess(id, repoData);
    },

    selectTab: function(id) {
        this.activeId = id;
        
        // Update Tabs
        Object.keys(this.items).forEach(key => {
            const item = this.items[key];
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

    closeTab: async function(id, stopCmd, path) {
        const item = this.items[id];
        if (!item) return;

        // Stop Process Backend
        try {
            await fetch('/api/runcmddev', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, stopcmd: stopCmd, directory: path })
            });
        } catch(e) { console.error(e); }

        // Cancel Reader if active
        if (item.reader) {
            try { await item.reader.cancel(); } catch(e) {}
        }

        // Remove UI
        item.tabElement.remove();
        item.panelElement.remove();
        delete this.items[id];

        // Select another tab if needed
        const keys = Object.keys(this.items);
        if (keys.length > 0) {
            this.selectTab(keys[keys.length - 1]);
        } else {
            this.activeId = null;
            document.getElementById('terminal-empty-state').classList.remove('hidden');
        }

        // Try to update card state if it exists on page
        // We need to find the ID associated with this name. 
        // Reverse lookup or just assume we can find the button if we are on the repo page.
        // But wait, the updateCardState requires an `id` (cache index), not name.
        // We stored `repoData` in `this.items[id].data`.
        // Does `repoData` have the cache `id`?
        // In `repositorycard.js`, we replaced {id} with the cache id.
        // `repoData` passed to `createTab` is the raw object.
        // We should probably pass the cache ID to createTab too.
        
        // However, `window.repoCache` is a dictionary where values are `data`.
        // We can search for the key where value.name === id (terminal id which is repo name).
        
        let cacheId = null;
        if (window.repoCache) {
            for (const key in window.repoCache) {
                 if (window.repoCache[key].name === id) {
                     cacheId = key;
                     break;
                 }
            }
        }
        
        if (cacheId && window.updateCardState) {
            window.updateCardState(cacheId, false);
        }
    },

    startProcess: async function(id, data) {
        const item = this.items[id];
        const panel = item.panelElement;

        const write = (text) => {
            const formatted = window.TerminalModal ? window.TerminalModal.parseAnsi(text) : text;
            const span = document.createElement('span');
            span.innerHTML = formatted;
            panel.appendChild(span);
            // Auto scroll
            if (this.activeId === id) {
                panel.scrollTop = panel.scrollHeight;
            }
        };

        write(`> Starting ${data.startcmd} in ${data.path}...\n`);

        try {
            const payload = {
                id: id,
                directory: data.path,
                basecmd: data.startcmd.split(' ')[0], // Simplistic parsing
                cmd: data.startcmd.split(' ').slice(1)
            };
            
            // Heuristic for "npm run dev" -> base: npm, cmd: run dev
            // If the startcmd is "npm run dev", basecmd="npm", cmd=["run", "dev"]

            const response = await fetch('/api/runcmddev', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if(!response.ok) {
                 const txt = await response.text();
                 write(`\nError starting process: ${txt}\n`);
                 return;
            }

            const reader = response.body.getReader();
            item.reader = reader;
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                write(chunk);
            }
            
            write('\n[Process Disconnected]\n');

        } catch (e) {
            write(`\nInternal Error: ${e.message}\n`);
        }
    }
};

// window.TabTerminal.init();
