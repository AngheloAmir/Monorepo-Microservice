// Logic for repoNew.html

let selectedType = 'service';

window.openAddModal = function() {
    document.getElementById('add-repo-modal').classList.remove('hidden');
    
    //clears some field
    document.getElementById('repo-name').value    = '';
    document.getElementById('repo-desc').value    = '';
    document.getElementById('repo-icon').value    = 'fa fa-cube';
    document.getElementById('repo-devurl').value  = 'localhost:3000';
    document.getElementById('repo-produrl').value = '';
    document.getElementById('repo-giturl').value    = '';
    document.getElementById('repo-gitorigin').value = '';
    document.getElementById('repo-gitbranch').value = '';
    document.getElementById('repo-install').value  = '';
    document.getElementById('repo-start').value    = '';
    document.getElementById('repo-stop').value     = '';
    document.getElementById('repo-build').value    = '';
    document.getElementById('repo-lint').value     = '';
    document.getElementById('repo-test').value     = '';
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

function renderTemplates(templates) {
    const list = document.getElementById('template-list');
    list.innerHTML = '';
    
    templates.forEach(t => {
        const div = document.createElement('div');
        div.className = 'p-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0 transition-colors flex flex-col gap-0.5';
        div.innerHTML = `
            <div class="text-[16px] text-white font-bold">${t.templatename}</div>
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
    document.getElementById('repo-init').value = template.templatepath;
    
    // Auto-fill Type
    if (template.type) {
        window.selectType(template.type);
    }

    // Auto-fill URLs
    document.getElementById('repo-devurl').value  = template.devurl || '';
    document.getElementById('repo-install').value = template.installcmd || '';
    document.getElementById('repo-start').value   = template.startcmd || '';
    document.getElementById('repo-stop').value    = template.stopcmd || '';
    document.getElementById('repo-build').value   = template.buildcmd || '';
    document.getElementById('repo-lint').value    = template.lintcmd || '';
    document.getElementById('repo-test').value    = template.testcmd || '';

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
        produrl: document.getElementById('repo-produrl').value,
        installcmd: document.getElementById('repo-install').value,
        startcmd: document.getElementById('repo-start').value,
        stopcmd: document.getElementById('repo-stop').value,
        buildcmd: document.getElementById('repo-build').value,
        lintcmd: document.getElementById('repo-lint').value,
        testcmd: document.getElementById('repo-test').value,
        template: document.getElementById('repo-init').value, 
        
        giturl: document.getElementById('repo-giturl').value,
        gitorigin: document.getElementById('repo-gitorigin').value,
        gitbranch: document.getElementById('repo-gitbranch').value, 
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
