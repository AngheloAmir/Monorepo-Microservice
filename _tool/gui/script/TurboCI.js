window.TurboCI = {
    currentProvider: null,
    editor: null,
    consoleDiv: null,
    currentRunId: null,

    PROVIDER_COMMANDS: {
        'vercel': 'npx --no-install turbo run build',
        'github': 'npx --no-install turbo run build test lint',
        'gitlab': 'npx --no-install turbo run build test lint',
        'circleci': 'npx --no-install turbo run build test lint',
        'travis': 'npx --no-install turbo run build test lint',
        'buildkite': 'npx --no-install turbo run build test lint'
    },

    init: function() {
        console.log("TurboCI Component Initializing...");
        
        // Init Console
        const consoleContainer = document.getElementById('turbo-ci-console');
        if (consoleContainer) {
             if (window.ConsoleDiv) {
                // Singleton pattern for console instance reusing container
                this.consoleDiv = new window.ConsoleDiv(consoleContainer);
             }
        }

        // Init Editor
        if (document.getElementById('turbo-ci-editor')) {
             // Check if Ace is loaded
             if (typeof ace !== 'undefined') {
                 this.editor = ace.edit("turbo-ci-editor");
                 this.editor.setTheme("ace/theme/dracula"); 
                 this.editor.session.setMode("ace/mode/yaml");
                 this.editor.setOptions({
                    fontSize: "14px",
                    showPrintMargin: false,
                 });
             }
        }

        // Init Socket
        this.initSocket();

        // Bind Provider Buttons
        const buttons = document.querySelectorAll('.ci-provider-btn');
        buttons.forEach(btn => {
             // Clone node to remove old listeners (cleanup)
             const newBtn = btn.cloneNode(true);
             btn.parentNode.replaceChild(newBtn, btn);
             
             newBtn.addEventListener('click', () => {
                 const provider = newBtn.dataset.provider;
                 this.loadProvider(provider);
                 
                 // Highlight active
                 document.querySelectorAll('.ci-provider-btn').forEach(b => {
                    b.classList.remove('ring-2', 'ring-blue-500', 'bg-gray-600');
                    b.classList.add('bg-gray-700'); 
                 });
                 newBtn.classList.add('ring-2', 'ring-blue-500', 'bg-gray-600');
                 newBtn.classList.remove('bg-gray-700');
             });
        });

        // Bind Actions
        this.bindClick('turbo-ci-save-btn', () => this.saveContent());
        this.bindClick('turbo-ci-docs-btn', () => this.openDocs());
        this.bindClick('turbo-ci-run-btn', () => this.runCommand());
        this.bindClick('turbo-ci-clear-console', () => {
             if(this.consoleDiv) this.consoleDiv.clear();
        });
        this.bindClick('turbo-ci-create-btn', () => this.createProviderFile());
        this.bindClick('turbo-ci-deploy-btn', () => this.insertDeploymentCode());
    },

    bindClick: function(id, handler) {
        const el = document.getElementById(id);
        if (el) {
             const newEl = el.cloneNode(true);
             el.parentNode.replaceChild(newEl, el);
             newEl.addEventListener('click', handler);
        }
    },

    initSocket: function() {
        if (!window.repoSocket) window.repoSocket = io();

        // Remove existing listener to avoid duplicates if re-inited
        window.repoSocket.off('runcmd-log');
        
        window.repoSocket.on('runcmd-log', (data) => {
             if (data && data.text) {
                 if (this.currentRunId && data.id === this.currentRunId) {
                     if (this.consoleDiv) this.consoleDiv.log(data.text);
                 }
             }
        });
    },

    loadProvider: async function(provider) {
        this.currentProvider = provider;
        const filenameProps = document.getElementById('turbo-ci-filename');
        if(filenameProps) filenameProps.textContent = 'Loading...';
        
        try {
            const res = await fetch(`/api/turbocicd?action=load&provider=${provider}`);
            const data = await res.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }

            const enableOverlay = document.getElementById('turbo-ci-enable-overlay');
            const editorEl = document.getElementById('turbo-ci-editor');
            const saveBtn = document.getElementById('turbo-ci-save-btn');
            
            // Check existence
            if (!data.exists && provider !== 'vercel') {
                enableOverlay.classList.remove('hidden');
                editorEl.classList.add('hidden');
                saveBtn.classList.add('hidden');
                
                document.getElementById('turbo-ci-provider-name').textContent = provider;
            } else {
                enableOverlay.classList.add('hidden');
                editorEl.classList.remove('hidden');
                saveBtn.classList.remove('hidden');
                
                this.editor.setValue(data.content || '', -1);
            }

            if(filenameProps) filenameProps.textContent = data.filePath;
            
            if (provider === 'vercel') this.editor.session.setMode("ace/mode/json");
            else this.editor.session.setMode("ace/mode/yaml");

            const docsBtn = document.getElementById('turbo-ci-docs-btn');
            if(docsBtn) {
                 docsBtn.classList.remove('hidden');
                 docsBtn.dataset.url = data.docUrl;
            }

            // Update Command Input
            const suggestedCmd = this.PROVIDER_COMMANDS[provider] || 'npx turbo run build test lint';
            const cmdInput = document.getElementById('turbo-ci-cmd-input');
            if(cmdInput) cmdInput.value = suggestedCmd;

        } catch (e) {
            console.error("Failed to load provider", e);
            if(filenameProps) filenameProps.textContent = 'Error loading provider';
        }
    },

    createProviderFile: async function() {
        if (!this.currentProvider) return;
        
        const btn = document.getElementById('turbo-ci-create-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        try {
            const res = await fetch(`/api/turbocicd?action=create&provider=${this.currentProvider}`, {
                method: 'POST'
            });
            const data = await res.json();
            
            if (data.success) {
                this.loadProvider(this.currentProvider);
            } else {
                alert('Failed to create: ' + (data.error || 'Unknown error'));
            }
        } catch(e) {
            alert('Error: ' + e.message);
        } finally {
            btn.innerHTML = originalText;
        }
    },

    saveContent: async function() {
        if (!this.currentProvider) return;
        const content = this.editor.getValue();
        
        const btn = document.getElementById('turbo-ci-save-btn');
        const icon = btn.querySelector('i');
        const originalIconClass = icon.className;
        
        icon.className = "fas fa-spinner fa-spin border-r border-blue-500 pr-2 mr-2";
        
        try {
            const res = await fetch(`/api/turbocicd?action=save&provider=${this.currentProvider}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            
            if (res.ok) {
                 icon.className = "fas fa-check border-r border-blue-500 pr-2 mr-2";
                 setTimeout(() => icon.className = originalIconClass, 2000);
            } else {
                 alert('Failed to save');
                 icon.className = originalIconClass;
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save: ' + e.message);
            icon.className = originalIconClass;
        }
    },

    openDocs: function() {
        const btn = document.getElementById('turbo-ci-docs-btn');
        const url = btn.dataset.url;
        if (url) window.open(url, '_blank');
    },

    runCommand: async function() {
        const input = document.getElementById('turbo-ci-cmd-input');
        const fullCmd = input.value.trim();
        if (!fullCmd) return;

        if (this.consoleDiv) this.consoleDiv.log(`> ${fullCmd}\n`);
        
        const parts = fullCmd.split(' ');
        let cmdParts = parts;
        if (parts[0] === 'npx') {
            cmdParts = parts.slice(1); 
        }
        
        const payload = { manualCommand: cmdParts };

        try {
             // We use /api/turborepo which maps to turborepohelper
             const res = await fetch('/api/turborepo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (data.runId) {
                this.currentRunId = data.runId;
                if (this.consoleDiv) this.consoleDiv.log(`> Started Process ID: ${data.runId}\n`, true);
            } else if (data.error) {
                 if (this.consoleDiv) this.consoleDiv.log(`Error: ${data.error}\n`, true);
            }

        } catch (e) {
             if (this.consoleDiv) this.consoleDiv.log(`Error: ${e.message}\n`, true);
        }
    },

    insertDeploymentCode: function() {
        if (!this.editor || !this.currentProvider) return;
        
        let snippet = "";
        
        if (this.currentProvider === 'vercel') {
            // JSON snippet
            snippet = `
  ,
  "build": {
    "env": {
      "MY_API_KEY": "@my-api-key"
    }
  }`;
             this.editor.navigateFileEnd();
             alert("For Vercel (JSON), please place cursor inside the JSON object before inserting.");
             this.editor.insert(snippet);
        } else {
            // YAML snippet
            snippet = `
      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: |
          echo "Deploying..."
          # Add your deployment commands here
`;
            this.editor.navigateFileEnd();
            this.editor.insert(snippet);
            this.editor.scrollToLine(this.editor.session.getLength(), true, true, function() {});
        }
    }
};
