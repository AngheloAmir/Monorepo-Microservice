(function() {
    console.log("TurboCI Script Loading...");
    
    let currentProvider = null;
    let editor = null;
    let consoleDiv = null;
    let currentRunId = null;

    const PROVIDER_COMMANDS = {
        'vercel': 'npx --no-install turbo run build',
        'github': 'npx --no-install turbo run build test lint',
        'gitlab': 'npx --no-install turbo run build test lint',
        'circleci': 'npx --no-install turbo run build test lint',
        'travis': 'npx --no-install turbo run build test lint',
        'buildkite': 'npx --no-install turbo run build test lint'
    };

    function init() {
         // Init Console
         const consoleContainer = document.getElementById('turbo-ci-console');
         if (consoleContainer) {
              if (window.ConsoleDiv) {
                   if (!window.turboCIConsoleInstance) {
                       window.turboCIConsoleInstance = new window.ConsoleDiv(consoleContainer);
                   } else {
                       const oldInstance = window.turboCIConsoleInstance;
                       window.turboCIConsoleInstance = new window.ConsoleDiv(consoleContainer);
                       window.turboCIConsoleInstance.rehydrate(oldInstance);
                   }
                   consoleDiv = window.turboCIConsoleInstance;
              }
         }

         // Init Editor
         if (document.getElementById('turbo-ci-editor')) {
             editor = ace.edit("turbo-ci-editor");
             editor.setTheme("ace/theme/dracula"); 
             editor.session.setMode("ace/mode/yaml");
             editor.setOptions({
                fontSize: "14px",
                showPrintMargin: false,
             });
         }

         // Init Socket
         initSocket();

         // Bind Provider Buttons
         const buttons = document.querySelectorAll('.ci-provider-btn');
         buttons.forEach(btn => {
             btn.addEventListener('click', () => {
                 const provider = btn.dataset.provider;
                 loadProvider(provider);
                 
                 // Highlight active
                 buttons.forEach(b => {
                    b.classList.remove('ring-2', 'ring-blue-500', 'bg-gray-600');
                    b.classList.add('bg-gray-700'); // Reset to default
                 });
                 btn.classList.add('ring-2', 'ring-blue-500', 'bg-gray-600');
                 btn.classList.remove('bg-gray-700');
             });
         });

         // Bind Actions
         document.getElementById('turbo-ci-save-btn').addEventListener('click', saveContent);
         document.getElementById('turbo-ci-docs-btn').addEventListener('click', openDocs);
         document.getElementById('turbo-ci-run-btn').addEventListener('click', runCommand);
         document.getElementById('turbo-ci-clear-console').addEventListener('click', () => {
             if(consoleDiv) consoleDiv.clear();
         });

         document.getElementById('turbo-ci-create-btn').addEventListener('click', createProviderFile);
         document.getElementById('turbo-ci-deploy-btn').addEventListener('click', insertDeploymentCode);
    }

    function initSocket() {
        if (!window.repoSocket) window.repoSocket = io();

        // Remove existing listener to avoid duplicates if re-inited
        window.repoSocket.off('runcmd-log');
        
        window.repoSocket.on('runcmd-log', (data) => {
             if (data && data.text) {
                 // Filter by RunID if we have one, otherwise ignore or show all? 
                 // Best to filter.
                 if (currentRunId && data.id === currentRunId) {
                     if (consoleDiv) consoleDiv.log(data.text);
                 }
             }
        });
    }

    async function loadProvider(provider) {
        currentProvider = provider;
        document.getElementById('turbo-ci-filename').textContent = 'Loading...';
        
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
                // Show Enable Overlay
                enableOverlay.classList.remove('hidden');
                editorEl.classList.add('hidden');
                saveBtn.classList.add('hidden');
                
                document.getElementById('turbo-ci-provider-name').textContent = provider;
                // Editor value ignored for now until created
            } else {
                // Show Editor
                enableOverlay.classList.add('hidden');
                editorEl.classList.remove('hidden');
                saveBtn.classList.remove('hidden');
                
                editor.setValue(data.content || '', -1);
            }

            document.getElementById('turbo-ci-filename').textContent = data.filePath;
            if (provider === 'vercel') editor.session.setMode("ace/mode/json");
            else editor.session.setMode("ace/mode/yaml");

            document.getElementById('turbo-ci-docs-btn').classList.remove('hidden');
            document.getElementById('turbo-ci-docs-btn').dataset.url = data.docUrl;

            // Update Command Input
            const suggestedCmd = PROVIDER_COMMANDS[provider] || 'npx turbo run build test lint';
            document.getElementById('turbo-ci-cmd-input').value = suggestedCmd;

        } catch (e) {
            console.error("Failed to load provider", e);
            document.getElementById('turbo-ci-filename').textContent = 'Error loading provider';
        }
    }

    async function createProviderFile() {
        if (!currentProvider) return;
        
        const btn = document.getElementById('turbo-ci-create-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        try {
            const res = await fetch(`/api/turbocicd?action=create&provider=${currentProvider}`, {
                method: 'POST'
            });
            const data = await res.json();
            
            if (data.success) {
                // Reload to show editor
                loadProvider(currentProvider);
            } else {
                alert('Failed to create: ' + (data.error || 'Unknown error'));
            }
        } catch(e) {
            alert('Error: ' + e.message);
        } finally {
            btn.innerHTML = originalText;
        }
    }

    async function saveContent() {
        if (!currentProvider) return;
        const content = editor.getValue();
        
        const btn = document.getElementById('turbo-ci-save-btn');
        const icon = btn.querySelector('i');
        const originalIconClass = icon.className;
        
        icon.className = "fas fa-spinner fa-spin border-r border-blue-500 pr-2 mr-2";
        
        try {
            const res = await fetch(`/api/turbocicd?action=save&provider=${currentProvider}`, {
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
    }

    function openDocs() {
        const url = document.getElementById('turbo-ci-docs-btn').dataset.url;
        if (url) window.open(url, '_blank');
    }

    async function runCommand() {
        const input = document.getElementById('turbo-ci-cmd-input');
        const fullCmd = input.value.trim();
        if (!fullCmd) return;

        if (consoleDiv) consoleDiv.log(`> ${fullCmd}\n`);
        
        // Parse command: check if it starts with turbo
        // Standardize: The turborepohelper expects 'action' (turbo run <action>) OR 'manualCommand' array
        
        const parts = fullCmd.split(' ');
        
        // Prepare payload
        let payload = {};
        
        // Heuristic: If it starts with 'npx turbo run <task>', extract task
        // But user might type arbitrary stuff.
        // turborepohelper 'manualCommand' passes raw args to npx --yes ...
        // So if user typed 'npx turbo run build', we want to pass ['turbo', 'run', 'build'] 
        // IF the helper uses npx by default for manualCommand.
        
        // Let's verify turborepohelper.js:
        // if (manualCommand && Array.isArray(manualCommand)) { args = ['--yes', ...manualCommand]; }
        // baseCmd = 'npx';
        
        // So if user types "npx turbo run build", we should strip "npx" and pass ["turbo", "run", "build"]
        // If user types "turbo run build", pass ["turbo", "run", "build"]
        
        let cmdParts = parts;
        if (parts[0] === 'npx') {
            cmdParts = parts.slice(1); 
        }
        
        // If user typed 'turbo', we keep it.
        // If user typed 'npm run build', we keep it? 
        // turborepohelper runs with npx. 'npx npm run build' works but is weird.
        // But the request is to use turborepohelper which is optimized for turbo interactions.
        
        payload = { manualCommand: cmdParts };

        try {
             // We use /api/turborepo which maps to turborepohelper
             const res = await fetch('/api/turborepo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (data.runId) {
                currentRunId = data.runId;
                if (consoleDiv) consoleDiv.log(`> Started Process ID: ${data.runId}\n`, true);
            } else if (data.error) {
                 if (consoleDiv) consoleDiv.log(`Error: ${data.error}\n`, true);
            }

        } catch (e) {
             if (consoleDiv) consoleDiv.log(`Error: ${e.message}\n`, true);
        }
    }
    


    function insertDeploymentCode() {
        if (!editor || !currentProvider) return;
        
        let snippet = "";
        
        if (currentProvider === 'vercel') {
            // JSON
            snippet = `
  ,
  "build": {
    "env": {
      "MY_API_KEY": "@my-api-key"
    }
  }`;
             editor.navigateFileEnd();
             // Simple hack for JSON, user will likely need to fix comma placement manually if specific
             // But appending to end of valid JSON is invalid. 
             // Let's just insert at cursor for JSON to be safe or warn.
             // editor.insert(snippet);
             alert("For Vercel (JSON), please place cursor inside the JSON object before inserting.");
             editor.insert(snippet);
        } else {
            // YAML
            snippet = `
      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: |
          echo "Deploying..."
          # Add your deployment commands here
`;
            editor.navigateFileEnd();
            editor.insert(snippet);
            editor.scrollToLine(editor.session.getLength(), true, true, function() {});
        }
    }
    
    init();
})();
