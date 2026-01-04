{
    // Namespace for Git CI Logic
    window.gitCi = {
        config: {
            remoteRepositoryUrl: "",
            baseBranch: "master"
        },

        init: function() {
            this.loadConfig();  // Load config first
            // Initial check
            setTimeout(() => window.checkAffected(), 500);
        },

        loadConfig: async function() {
            try {
                const res = await fetch('/api/ci', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get-config' })
                });
                const data = await res.json();
                
                if (data && !data.error) {
                    this.config = data;
                }
                
                this.updateUiWithConfig();
            } catch (e) {
                console.error("Failed to load CI config", e);
            }
        },

        updateUiWithConfig: function() {
            // Update Base Branch Display
            const baseBranchEl = document.getElementById('git-ci-base-branch');
            if(baseBranchEl) baseBranchEl.textContent = this.config.baseBranch || 'master';

            // Update Header Inputs
            const inputRemote = document.getElementById('setting-remote-url');
            const inputBranch = document.getElementById('setting-base-branch');
            if(inputRemote) inputRemote.value = this.config.remoteRepositoryUrl || '';
            if(inputBranch) inputBranch.value = this.config.baseBranch || 'master';
        },

        saveSettings: function() {
            const inputRemote = document.getElementById('setting-remote-url');
            const inputBranch = document.getElementById('setting-base-branch');
            
            if(inputRemote) this.config.remoteRepositoryUrl = inputRemote.value;
            if(inputBranch) this.config.baseBranch = inputBranch.value;
            
            // Note: Server save implementation is pending, so we update UI locally for now.
            
            this.updateUiWithConfig();
            
            // Visual feedback on the save button if needed, but since it's inline, just a flash
            const btn = document.querySelector('button[title="Save Configuration"] i');
            if(btn) {
                const original = btn.className;
                btn.className = "fas fa-check text-green-400";
                setTimeout(() => btn.className = original, 1000);
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
                <div class="mb-2"><i class="fas fa-circle-notch fa-spin text-2xl"></i></div>
                <div>Analyzing changes via Turbo against <span class="font-bold text-gray-400">${window.gitCi.config.baseBranch}</span>...</div>
                <div class="text-[10px] text-gray-600 mt-1">Checking git diff & turbo graph...</div>
            </div>
        `;
        
        try {
            // Fetch real status from server
            const res = await fetch('/api/ci', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check-status' })
            });
            const data = await res.json();
            
            if (data.error) throw new Error(data.error);

            // Update UI with Real Data
            if (branchEl) branchEl.textContent = data.currentBranch;
            
            let html = '';
            let affectedWorkspaces = [];
            
            // Process Turbo Plan (if available) or fallback to Git Diff
            if (data.turboPlan && data.turboPlan.packages) {
                // Turbo dry run JSON format: { packages: [...], tasks: [...] }
                affectedWorkspaces = data.turboPlan.packages;
            } else if (data.changedFiles) {
                // Simple heuristic if turbo failed or wasn't used
                // Filter files to see what folders changed? 
                // For now, let's just show changed files count if turbo didn't return packages
                html += `<div class="col-span-4 text-yellow-500 text-center">Turbo analysis unavailable. Found ${data.changedFiles.length} file changes.</div>`;
            }

            if (affectedWorkspaces.length > 0) {
                affectedWorkspaces.forEach(w => {
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
            } else if (data.changedFiles && data.changedFiles.length === 0) {
                 html = `
                    <div class="col-span-4 text-center py-8 text-gray-500">
                        <i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
                        <div>No changes detected against base branch.</div>
                    </div>
                `;
            } else if (affectedWorkspaces.length === 0 && data.changedFiles.length > 0) {
                 html += `
                    <div class="col-span-4 text-center py-8 text-gray-500">
                        <i class="fas fa-info-circle text-blue-500 text-2xl mb-2"></i>
                        <div>Changes detected but no workspaces affected (root files only?).</div>
                    </div>
                `;
            }

            // Error display
            if (data.turboError) {
                html += `
                 <div class="col-span-4 mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-xs text-red-400 font-mono overflow-x-auto">
                    <strong>Turbo Error:</strong> ${data.turboError}
                </div>`;
            }

            container.innerHTML = html;

        } catch (e) {
            container.innerHTML = `
                <div class="col-span-4 text-center py-8 text-red-400">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <div>Error checking status</div>
                    <div class="text-xs text-gray-500 mt-2">${e.message}</div>
                </div>
            `;
        }
    };

    // Auto Init
    window.gitCi.init();
}
