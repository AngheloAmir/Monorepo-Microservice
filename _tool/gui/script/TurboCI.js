(function() {
    console.log("TurboCI Script Loading...");
    
    let currentProvider = null;
    let editor = null;
    let consoleDiv = null;
    let currentRunId = null;

    const PROVIDER_COMMANDS = {
        'vercel': 'npx turbo run build',
        'github': 'npx turbo run build test lint',
        'gitlab': 'npx turbo run build test lint',
        'circleci': 'npx turbo run build test lint',
        'travis': 'npx turbo run build test lint',
        'buildkite': 'npx turbo run build test lint'
    };

    function init() {
         // Init Console
         const consoleContainer = document.getElementById('turbo-ci-console');
         if (consoleContainer) {
             consoleDiv = new ConsoleDiv(consoleContainer);
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
            const res = await fetch(`/api/turboci?action=load&provider=${provider}`);
            const data = await res.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }

            // Set content
            editor.setValue(data.content || '', -1); 
            document.getElementById('turbo-ci-filename').textContent = data.filePath;
            
            if (provider === 'vercel') editor.session.setMode("ace/mode/json");
            else editor.session.setMode("ace/mode/yaml");

            // Show buttons
            document.getElementById('turbo-ci-save-btn').classList.remove('hidden');
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

    async function saveContent() {
        if (!currentProvider) return;
        const content = editor.getValue();
        
        const btn = document.getElementById('turbo-ci-save-btn');
        const icon = btn.querySelector('i');
        const originalIconClass = icon.className;
        
        icon.className = "fas fa-spinner fa-spin border-r border-blue-500 pr-2 mr-2";
        
        try {
            const res = await fetch(`/api/turboci?action=save&provider=${currentProvider}`, {
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
        
        // Parse command (naive split)
        const parts = fullCmd.split(' ');
        const basecmd = parts[0];
        const cmd = parts.slice(1);

        try {
             const res = await fetch('/api/runcmd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    directory: '.', 
                    basecmd, 
                    cmd 
                }) 
            });
            
            const data = await res.json();
            
            if (data.runId) {
                currentRunId = data.runId;
            } else if (data.error) {
                 if (consoleDiv) consoleDiv.log(`Error: ${data.error}\n`, true);
            }

        } catch (e) {
             if (consoleDiv) consoleDiv.log(`Error: ${e.message}\n`, true);
        }
    }
    
    init();
})();
