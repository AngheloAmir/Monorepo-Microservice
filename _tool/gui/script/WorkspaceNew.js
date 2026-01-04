// Logic for WorkspaceNew.html


window.openAddModal = function() {
    document.getElementById('add-workspace-modal').classList.remove('hidden');
    
    //clears some field
    document.getElementById('workspace-name').value    = '';
    document.getElementById('workspace-desc').value    = '';
    document.getElementById('workspace-icon').value    = 'fa fa-cube';
    document.getElementById('add-icon-preview').className = 'fa fa-cube';
    document.getElementById('workspace-devurl').value  = 'localhost:3000';
    document.getElementById('workspace-produrl').value = '';
    document.getElementById('workspace-giturl').value    = '';
    document.getElementById('workspace-gitorigin').value = '';
    document.getElementById('workspace-gitbranch').value = '';
    document.getElementById('workspace-install').value  = '';
    document.getElementById('workspace-dev').value      = '';
    document.getElementById('workspace-start').value    = '';
    document.getElementById('workspace-stop').value     = '';
    document.getElementById('workspace-build').value    = '';
    document.getElementById('workspace-lint').value     = '';
    document.getElementById('workspace-test').value     = '';
    document.getElementById('workspace-init').value     = '';
    
    // Default to service
    window.selectType('service');
};

window.closeAddModal = function() {
    document.getElementById('add-workspace-modal').classList.add('hidden');
};

window.selectType = function(type) {
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

function renderTemplates(templates) {
    const list = document.getElementById('template-list');
    list.innerHTML = '';
    
    templates.forEach(t => {
        const div = document.createElement('div');
        div.className = 'p-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0 transition-colors flex flex-col gap-0.5';
        let displayName = t.templatename;
        const match = displayName.match(/^\[(.*?)\]\s*(.*)$/);
        if (match) {
            displayName = `<span class="text-orange-400">${match[1]}</span> ${match[2]}`;
        }

        div.innerHTML = `
            <div class="text-[16px] text-white font-bold">${displayName}</div>
            <div class="text-[14px] text-gray-500 font-mono truncate">${t.templatepath}</div>
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
    document.getElementById('workspace-init').value = template.templatepath;
    
    // Auto-fill Type
    if (template.type) {
        window.selectType(template.type);
    }

    // Auto-fill URLs
    document.getElementById('workspace-devurl').value  = template.devurl || 'http://localhost:3000';
    document.getElementById('workspace-install').value = template.installcmd || '';
    document.getElementById('workspace-dev').value     = template.devcmd || '';
    document.getElementById('workspace-start').value   = template.startcmd || '';
    document.getElementById('workspace-stop').value    = template.stopcmd || '';
    document.getElementById('workspace-build').value   = template.buildcmd || '';
    document.getElementById('workspace-lint').value    = template.lintcmd || '';
    document.getElementById('workspace-test').value    = template.testcmd || '';
    document.getElementById('workspace-icon').value    = template.icon;
    document.getElementById('add-icon-preview').className = template.icon;

    // Close menu
    document.getElementById('template-menu').classList.add('hidden');
    
}

window.createWorkspace = async function() {
    const createBtn = document.querySelector('#add-workspace-modal button.bg-blue-600');
    if(createBtn) {
        createBtn.dataset.originalText = createBtn.innerText;
        createBtn.innerText = 'Creating...';
        createBtn.disabled = true;
    }

    const data = {
        name: document.getElementById('workspace-name').value,
        description: document.getElementById('workspace-desc').value,
        icon: document.getElementById('workspace-icon').value,
        type: document.querySelector('#add-workspace-modal .type-btn.active')?.dataset.type || 'service', 
        devurl: document.getElementById('workspace-devurl').value,
        produrl: document.getElementById('workspace-produrl').value,
        installcmd: document.getElementById('workspace-install').value,
        devcmd: document.getElementById('workspace-dev').value,
        startcmd: document.getElementById('workspace-start').value,
        stopcmd: document.getElementById('workspace-stop').value,
        buildcmd: document.getElementById('workspace-build').value,
        lintcmd: document.getElementById('workspace-lint').value,
        testcmd: document.getElementById('workspace-test').value,
        template: document.getElementById('workspace-init').value, 
        
        giturl: document.getElementById('workspace-giturl').value,
        gitorigin: document.getElementById('workspace-gitorigin').value,
        gitbranch: document.getElementById('workspace-gitbranch').value, 
    };
    
    try {
        const response = await fetch('/api/create-workspace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            closeAddModal();
            await window.loadWorkspaceData();

            // If template AND installcmd is present, run Install Command
            if (data.template && data.template.trim() !== '' && data.installcmd && data.installcmd.trim() !== '') {
                
                // Determine command components
                const parts = data.installcmd.trim().split(' ');
                const baseCmd = parts[0];
                const cmdToRun = parts.slice(1);

                await runCommandStream({
                    directory: `${data.type}/${data.name}`,
                    basecmd: baseCmd,
                    cmd: cmdToRun
                });
            }

        } else {
            console.error(result);
            alert('Failed to create workspace: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error while creating workspace: ' + error.message);
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

    // Ensure socket init
    if (window.TabTerminal && window.TabTerminal.initSocket) {
        window.TabTerminal.initSocket();
    } else if (!window.repoSocket && window.io) {
        window.repoSocket = io();
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

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        const data = await response.json();
        const runId = data.runId;

        // Listen for logs
        const logHandler = (msg) => {
            if (msg && msg.id === runId) {
                if (msg.text === '::DONE::') {
                    window.TerminalModal.setRunning(false);
                    window.TerminalModal.write('\n\n--- Process Completed ---\n');
                    window.repoSocket.off('runcmd-log', logHandler);
                } else {
                    window.TerminalModal.write(msg.text);
                }
            }
        };

        if(window.repoSocket) {
            window.repoSocket.on('runcmd-log', logHandler);
        } else {
             window.TerminalModal.write('\nError: Socket connection unavailable.\n');
        }

    } catch (e) {
        window.TerminalModal.write(`\nError: ${e.message}\n`);
        window.TerminalModal.setRunning(false);
    }
}
