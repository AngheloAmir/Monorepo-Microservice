
{
    let cardRenderer;
    const sections = ['backend', 'database', 'service', 'frontend'];

    async function initRepoPage() {
        console.log('Repo script loaded');
        
        // Fetch Template
        let cardTemplate = '';
        try {
            const response = await fetch('/gui/components/repositorycard.html');
            if(response.ok) {
                cardTemplate = await response.text();
            } else {
                console.error('Failed to load card template');
                return;
            }
        } catch (e) {
            console.error('Error fetching template', e);
            return;
        }

        cardRenderer = new RepositoryCard(cardTemplate);

        // Init Terminal in this view
        if (window.TabTerminal) {
            const mount = document.getElementById('repo-terminal-mount');
            if (mount) {
                await window.TabTerminal.init(mount);
            }
        }

        await window.loadRepositoryData();
    }

    window.loadRepositoryData = async function() {
        if (!cardRenderer) return;

        // Clear current state if necessary or let innerHTML replace handle it. 
        // We might want to show a spinner if it takes time, but for now fast replace.

        try {
            const response = await fetch('/api/repository');
            if(!response.ok) throw new Error('API Error');
            const data = await response.json();
            
            let hasItems = false;

            sections.forEach(section => {
                const items = data[section];
                const container = document.getElementById(`container-${section}`);
                const sectionEl = document.getElementById(`section-${section}`);
                const countEl = document.getElementById(`count-${section}`);

                if (items && items.length > 0 && container) {
                    hasItems = true;
                    sectionEl.classList.remove('hidden');
                    sectionEl.classList.add('animate-fade-in'); 
                    countEl.textContent = items.length;

                    let html = '';
                    items.forEach((item, index) => {
                        const uniqueId = `${section}-${index}`;
                        html += cardRenderer.render(item, uniqueId);
                    });
                    container.innerHTML = html;
                } else if (container) {
                     // Explicitly handle empty sections if valid container exists
                     // sectionEl.classList.add('hidden'); // Optional: hide if empty?
                     // container.innerHTML = '';
                }
            });

            if (!hasItems) {
                document.getElementById('empty-state').classList.remove('hidden');
            } else {
                document.getElementById('empty-state').classList.add('hidden');
            }

        } catch (error) {
            console.error('Error loading repository data:', error);
            // Show error state
             document.getElementById('empty-state').querySelector('p').textContent = 'Error loading data: ' + error.message;
             document.getElementById('empty-state').classList.remove('hidden');
        }
    };

    // Start initialization
    initRepoPage();


    // --- Modal Logic ---
    // Use window properties for these or they need to be re-bound every time.
    // However, since they are called from HTML onclick attributes (implied by previous code style),
    // they MUST be on window.

    // var selectedType = 'service'; // If this is var in block, it is local.
    // But window.selectType needs access to it.
    // So we attach it to window or keep it in closure scope of window.selectType.
    
    // Simplest: attached to window to persist state across reloads? No, reloads reset state.
    // Closure scope is fine.

    let selectedType = 'service';

    window.openAddModal = function() {
        document.getElementById('add-repo-modal').classList.remove('hidden');
    };

    window.closeAddModal = function() {
        document.getElementById('add-repo-modal').classList.add('hidden');
    };

    window.selectType = function(type) {
        selectedType = type;
        
        // Reset all buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active', 'border-blue-500', 'bg-blue-500/10');
            btn.classList.add('border-gray-700', 'bg-gray-900/50');
        });

        // Activate selected
        const activeBtn = document.querySelector(`.type-btn[data-type="${type}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('border-gray-700', 'bg-gray-900/50');
            activeBtn.classList.add('active', 'border-blue-500', 'bg-blue-500/10');
        }
    };

    window.toggleTemplateMenu = async function() {
        const menu = document.getElementById('template-menu');
        const list = document.getElementById('template-list');
        
        if (menu.classList.contains('hidden')) {
            menu.classList.remove('hidden');
            
            // Load templates if needed
            if (list.children.length <= 1) { 
                try {
                    const res = await fetch('/api/repotemplate');
                    if (res.ok) {
                        const templates = await res.json();
                        renderTemplates(templates);
                    } else {
                        list.innerHTML = '<div class="p-2 text-red-400 text-xs">Failed to load templates</div>';
                    }
                } catch (e) {
                    console.error(e);
                    list.innerHTML = '<div class="p-2 text-red-400 text-xs">Error loading templates</div>';
                }
            }
        } else {
            menu.classList.add('hidden');
        }
    };

    // Helper functions need to be visible to window functions or defined inside.
    // renderTemplates is called by window.toggleTemplateMenu.
    // If I define it here, window.toggleTemplateMenu (closure) can see it.

    function renderTemplates(templates) {
        const list = document.getElementById('template-list');
        list.innerHTML = '';
        
        templates.forEach(t => {
            const div = document.createElement('div');
            div.className = 'p-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0 transition-colors flex flex-col gap-0.5';
            div.innerHTML = `
                <div class="text-[10px] text-white font-bold uppercase tracking-wide">${t.templatename}</div>
                <div class="text-[9px] text-gray-500 font-mono truncate">${t.templatepath}</div>
            `;
            div.onclick = () => {
                selectTemplate(t);
            };
            list.appendChild(div);
        });
        
        if (templates.length === 0) {
             list.innerHTML = '<div class="p-2 text-center text-gray-500 text-[10px]">No templates found</div>';
        }
    }

    function selectTemplate(template) {
        // Fill init command with text: "TEMPLATE: <path>" to indicate it's using a template
        document.getElementById('repo-init').value = template.templatepath;
        
        // Close menu
        document.getElementById('template-menu').classList.add('hidden');
    }

    window.createRepository = async function() {
        const createBtn = document.querySelector('#add-repo-modal button.bg-blue-600');
        if(createBtn) {
            createBtn.dataset.originalText = createBtn.innerText;
            createBtn.innerText = 'Creating...';
            createBtn.disabled = true;
        }

        const data = {
            name: document.getElementById('repo-name').value,
            description: document.getElementById('repo-desc').value,
            icon: document.getElementById('repo-icon').value,
            type: selectedType, 
            devurl: document.getElementById('repo-devurl').value,
            startcmd: document.getElementById('repo-start').value,
            stopcmd: document.getElementById('repo-stop').value,
            buildcmd: document.getElementById('repo-build').value,
            template: document.getElementById('repo-init').value, 
        };
        
        try {
            const response = await fetch('/api/create-repository', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                closeAddModal();
                await window.loadRepositoryData();

                // If template, run NPM Install
                if (data.template && data.template.trim() !== '') {
                     await runCommandStream({
                        directory: `${data.type}/${data.name}`,
                        basecmd: 'npm',
                        cmd: ['install']
                    });
                }

            } else {
                console.error(result);
                alert('Failed to create repository: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Network error while creating repository: ' + error.message);
        } finally {
            if(createBtn) {
                createBtn.innerText = createBtn.dataset.originalText || 'Create';
                createBtn.disabled = false;
            }
        }
    };

    async function runCommandStream(payload) {
        if (!window.TerminalModal) {
            console.error('TerminalModal not found');
            return;
        }

        await window.TerminalModal.open();
        window.TerminalModal.write(`Starting command: ${payload.basecmd} ${payload.cmd.join(' ')}\n`);
        window.TerminalModal.write(`Directory: ${payload.directory}\n\n`);

        try {
            const response = await fetch('/api/runcmd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                window.TerminalModal.write(chunk);
            }
            
            window.TerminalModal.setRunning(false);
            window.TerminalModal.write('\n\n--- Process Completed ---\n');

        } catch (e) {
            window.TerminalModal.write(`\nError: ${e.message}\n`);
            window.TerminalModal.setRunning(false);
        }
    }
}
