window.TurboDeployScript = {
    workspaces: [],
    currentWs: null,

    init: async function() {
        console.log("Pipeline Editor Initializing...");
        await this.refresh();
        
        // Search listener
        const searchInput = document.getElementById('pe-search');
        if(searchInput) {
            // Clone to remove old listener
             const newSearch = searchInput.cloneNode(true);
             searchInput.parentNode.replaceChild(newSearch, searchInput);
             newSearch.addEventListener('input', (e) => {
                this.renderList(e.target.value);
            });
        }
    },

    refresh: async function() {
        try {
            const res = await fetch('/api/activepipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-workspaces' })
            });
            const data = await res.json();
            this.workspaces = data.workspaces || [];
            this.renderList();
        } catch(e) {
            console.error(e);
        }
    },

    renderList: function(filter = '') {
        const list = document.getElementById('pe-list');
        if(!list) return;
        list.innerHTML = '';
        
        this.workspaces.forEach(ws => {
            if (filter && !ws.name.toLowerCase().includes(filter.toLowerCase())) return;
            
            const isActive = this.currentWs && this.currentWs.name === ws.name;
            const activeClass = isActive ? 'bg-teal-500/10 border-teal-500/50' : 'border-transparent hover:bg-gray-800';
            
            const el = document.createElement('div');
            el.className = `p-3 rounded-lg border cursor-pointer group flex items-center gap-3 transition-all ${activeClass}`;
            el.onclick = () => this.selectWorkspace(ws);
            el.innerHTML = `
                <div class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    <i class="${ws.icon || 'fas fa-box'}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold text-gray-200 group-hover:text-white truncate">${ws.name}</div>
                    <div class="text-[10px] text-gray-600 truncate">${ws.type || 'package'}</div>
                </div>
            `;
            list.appendChild(el);
        });
    },

    selectWorkspace: function(ws) {
        this.currentWs = ws;
        const searchEl = document.getElementById('pe-search');
        if(searchEl) this.renderList(searchEl.value);
        
        document.getElementById('pe-empty').classList.add('hidden');
        document.getElementById('pe-editor').classList.remove('hidden');
         document.getElementById('pe-editor').classList.remove('flex');  // ensure no duplicate flex
        document.getElementById('pe-editor').classList.add('flex');

        document.getElementById('pe-title').textContent = ws.name;
        document.getElementById('pe-icon').innerHTML = `<i class="${ws.icon || 'fas fa-box'}"></i>`;
        
        // Populate inputs
        const scripts = ws.scripts || {};
        const buildInput = document.getElementById('script-build');
        const deployInput = document.getElementById('script-deploy');
        
        if (buildInput) buildInput.value = scripts.build || '';
        if (deployInput) deployInput.value = scripts.deploy || '';
    },

    save: async function(scriptKey) {
        if (!this.currentWs) return;
        
        const input = document.getElementById(`script-${scriptKey}`);
        const cmd = input.value;
        
        // Visual feedback
        const btn = input.nextElementSibling;
        const originalText = btn.textContent;
        btn.textContent = '...';
        
        try {
            const res = await fetch('/api/activepipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'save-script',
                    workspacePath: this.currentWs.path,
                    scriptName: scriptKey,
                    command: cmd
                })
            });
            
            if (res.ok) {
                btn.textContent = 'SAVED';
                btn.classList.add('bg-green-500', 'text-white');
                setTimeout(() => {
                     btn.textContent = originalText;
                     btn.classList.remove('bg-green-500', 'text-white');
                     
                     // Update local cache
                     if (!this.currentWs.scripts) this.currentWs.scripts = {};
                     this.currentWs.scripts[scriptKey] = cmd;
                }, 1000);
            }
        } catch(e) {
            alert('Save failed');
        }
    },

    applySnippet: function(type) {
         if (!this.currentWs) return;
         const deployInput = document.getElementById('script-deploy');
         
         if(type === 'vercel') {
             deployInput.value = 'vercel deploy --prod';
         } else if (type === 's3') {
             deployInput.value = 'aws s3 sync dist/ s3://my-bucket --region us-east-1';
         }
    }
};
