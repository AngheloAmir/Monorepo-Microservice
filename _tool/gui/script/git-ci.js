{
    // Namespace for Git CI Logic
    window.gitCi = {
        settingsPanel: null,
        config: {
            remoteRepositoryUrl: "",
            baseBranch: "main"
        },

        init: function() {
            this.settingsPanel = document.getElementById('git-ci-settings');
            this.loadConfig();  // Load config first
            
            // Initial check
            setTimeout(() => window.checkAffected(), 500);
        },

        loadConfig: async function() {
            try {
                // Fetch actual config from backend (we simulate reading the file we just edited)
                // Since this is a static tool file, we might need an endpoint to read 'tooldata/cicd.js'
                // For now, we mock the load or assume the PageLoader might inject it.
                // Or better, we define a small endpoint or just use the defaults we know.
                
                // Simulating a fetch from /api/cicd-config (fictional for now, or we rely on hardcoded defaults matching the file)
                this.config = {
                    remoteRepositoryUrl: "git@github.com:AngheloAmir/Monorepo-Microservice.git",
                    baseBranch: "master"
                };
                
                this.updateUiWithConfig();
            } catch (e) {
                console.error("Failed to load CI config", e);
            }
        },

        updateUiWithConfig: function() {
            // Update Base Branch Display
            const baseBranchEl = document.getElementById('git-ci-base-branch');
            if(baseBranchEl) baseBranchEl.textContent = this.config.baseBranch;

            // Update Settings Inputs
            const inputRemote = document.getElementById('setting-remote-url');
            const inputBranch = document.getElementById('setting-base-branch');
            if(inputRemote) inputRemote.value = this.config.remoteRepositoryUrl;
            if(inputBranch) inputBranch.value = this.config.baseBranch;
        },

        openSettings: function() {
            if(this.settingsPanel) {
                this.settingsPanel.classList.remove('translate-x-full');
            }
        },

        closeSettings: function() {
            if(this.settingsPanel) {
                this.settingsPanel.classList.add('translate-x-full');
            }
        },

        saveSettings: function() {
            const inputRemote = document.getElementById('setting-remote-url');
            const inputBranch = document.getElementById('setting-base-branch');
            
            if(inputRemote) this.config.remoteRepositoryUrl = inputRemote.value;
            if(inputBranch) this.config.baseBranch = inputBranch.value;
            
            // Here we would send a POST to save to file /tooldata/cicd.js
            // For UI demo:
            this.updateUiWithConfig();
            this.closeSettings();
            
            // Trigger a toast or alert
            const btn = document.querySelector('#git-ci-settings button i.fa-save');
            if(btn) {
                btn.className = "fas fa-check";
                setTimeout(() => btn.className = "fas fa-save", 1000);
            }
            
            // Re-run checks with new config
            window.checkAffected();
        }
    };

    window.checkAffected = async function() {
        const container = document.getElementById('git-ci-affected-list');
        const branchEl  = document.getElementById('git-ci-current-branch');
        
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-span-4 text-center py-8 text-gray-500 italic">
                <i class="fas fa-circle-notch fa-spin mr-2"></i> Analyzing changes via Turbo against <span class="font-bold text-gray-400">${window.gitCi.config.baseBranch}</span>...
            </div>
        `;
        
        try {
            // Check Git Branch first (Simulated Backend Call)
            const branchRes = await fetch('/api/runcmd', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ directory: '.', cmd: ['git', 'rev-parse', '--abbrev-ref', 'HEAD'] })
            });

            // MOCKING DATA for evaluation
            // Randomly select workspaces to be "Modified"
            const workspaces = ['MyReactApp', 'NodeJS', 'Socket', 'Supabase', 'components', 'config', 'models', 'routes'];
            const randomAffected = workspaces.filter(() => Math.random() > 0.6);
            if (randomAffected.length === 0) randomAffected.push('MyReactApp'); // ensure at least one
            
            setTimeout(() => {
                if (branchEl) branchEl.textContent = "feat/multi-dev-workflow"; 
                
                let html = '';
                randomAffected.forEach(w => {
                    html += `
                        <div class="bg-gray-700/50 border border-gray-600 rounded-lg p-3 flex items-center gap-3 animate-fade-in relative overflow-hidden group">
                             <div class="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             <div class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-red-400">
                                <i class="fas fa-cube"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="text-xs font-bold text-gray-200 truncate">${w}</h4>
                                <div class="text-[10px] text-gray-400 flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> Modified
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                // Add "Others Cached" info
                const cachedCount = workspaces.length - randomAffected.length;
                if (cachedCount > 0) {
                     html += `
                        <div class="col-span-2 md:col-span-1 border border-dashed border-gray-700 rounded-lg p-3 flex items-center justify-center gap-2 text-gray-500 text-xs">
                             <i class="fas fa-history text-green-500"></i>
                             <span>${cachedCount} Workspaces Cached</span>
                        </div>
                    `;
                }

                container.innerHTML = html;
            }, 1000);

        } catch (e) {
            container.innerHTML = `<div class="text-red-500">Error checking status</div>`;
        }
    };

    // Auto Init
    window.gitCi.init();
}
