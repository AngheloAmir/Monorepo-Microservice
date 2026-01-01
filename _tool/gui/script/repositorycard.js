class RepositoryCard {
    constructor(template) {
        this.template = template;
    }

    render(data, index) {
        let html   = this.template;

        /** The ID of the process, it will unique by using type + name */
        /** The ID of the process, it will unique by using type + name */
        const processID             = data.type + '-' + data.name;
        
        // Use the index-based ID (e.g. 'service-0') for cache and DOM IDs to match backend expectation
        const uniqueID = index; 
        window.repoCache            = window.repoCache || {};
        window.repoCache[uniqueID]  = data;
        
        const isRunning             = 
                window.TabTerminal && 
                window.TabTerminal.isRunning && 
                window.TabTerminal.isRunning(processID);
        
        let btnHtml = '';
        if (isRunning) {
             btnHtml = `<button id="btn-action-${uniqueID}" onclick="window.stopDevRepo('${uniqueID}')" class="flex-1 py-2 px-3 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 text-sm font-medium flex items-center justify-center gap-2">
                <i class="fas fa-stop text-xs"></i> Stop
            </button>`;
        } else {
             btnHtml = `<button id="btn-action-${uniqueID}" onclick="window.startDevRepo('${uniqueID}')" class="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm font-medium flex items-center justify-center gap-2">
                <i class="fas fa-play text-xs"></i> Start Dev
            </button>`;
        }


        if (html.includes('Start Dev')) {
            const btnStartMarker = '<button class="flex-1';
            const btnEndMarker   = '</button>';
            
            const idx1 = html.indexOf(btnStartMarker);
            if (idx1 !== -1) {
                const idx2 = html.indexOf(btnEndMarker, idx1);
                if (idx2 !== -1) {
                    const originalBtn = html.substring(idx1, idx2 + btnEndMarker.length);
                    html = html.replace(originalBtn, btnHtml);
                }
            }
        }

        // Handle Open App Button visibility
        if (isRunning) {
            html = html.replace('class="hidden px-2', 'class="flex px-2');
        }

        // Replace basic placeholders
        html = html.replace(/{name}/g, data.name || 'Untitled');
        html = html.replace(/{description}/g, data.description || 'No description');
        html = html.replace(/{icon}/g, data.icon || 'fas fa-cube');
        html = html.replace(/{type}/g, data.type || 'service');
        
        // IMPORTANT: {id} must match the backend format (section-index)
        html = html.replace(/{id}/g, uniqueID);
        
        html = html.replace(/{gitbranch}/g, data.gitbranch || 'master'); 
        
        // Command replacements
        html = html.replace(/{devurl}/g, data.devurl || '#');
        html = html.replace(/{produrl}/g, data.produrl || '#');
        html = html.replace(/{startcmd}/g, data.startcmd || 'npm run dev');
        html = html.replace(/{stopcmd}/g, data.stopcmd || 'npm run stop');
        html = html.replace(/{buildcmd}/g, data.buildcmd || 'npm run build');
        html = html.replace(/{lintcmd}/g, data.lintcmd || 'npm run lint');
        html = html.replace(/{template}/g, data.template || 'None');
        
        return html;
    }
}

// Global Settings Modal Logic
window.activeSettingsId = null;

window.openSettingsModal = function(id) {
    const data = window.repoCache[id];
    if (!data) return;

    window.activeSettingsId = id;
    const modal = document.getElementById('repository-settings-modal');
    
    // Populate fields
    document.getElementById('settings-title-name').textContent = data.name;
    
    // Text based fields
    document.getElementById('modal-text-name').textContent = data.name || 'Untitled';
    document.getElementById('modal-text-type').textContent = (data.type || 'service').toUpperCase();
    document.getElementById('modal-text-template').textContent = data.template || 'None';

    document.getElementById('modal-input-icon').value = data.icon || '';
    document.getElementById('modal-input-desc').value = data.description || '';
    
    // Update icon preview
    const iconPreview = document.getElementById('modal-icon-preview');
    iconPreview.className = data.icon || 'fas fa-cube';
    
    // Listen for icon changes
    document.getElementById('modal-input-icon').oninput = function() {
        iconPreview.className = this.value;
    };

    document.getElementById('modal-input-devurl').value = data.devurl || '';
    document.getElementById('modal-input-produrl').value = data.produrl || '';
    
    document.getElementById('modal-input-start').value = data.startcmd || '';
    document.getElementById('modal-input-stop').value = data.stopcmd || '';
    document.getElementById('modal-input-build').value = data.buildcmd || '';
    document.getElementById('modal-input-lint').value = data.lintcmd || 'npm run lint';

    // Git Config
    document.getElementById('modal-input-giturl').value = data.giturl || '';
    document.getElementById('modal-input-gitorigin').value = data.gitorigin || 'origin';
    document.getElementById('modal-input-gitbranch').value = data.gitbranch || 'master';
   
    // Show modal
    modal.classList.remove('hidden');
};

window.closeSettingsModal = function() {
    document.getElementById('repository-settings-modal').classList.add('hidden');
    window.activeSettingsId = null;
};

window.updateCardState = function(id, isRunning) {
    const btn     = document.getElementById(`btn-action-${id}`);
    const openBtn = document.getElementById(`btn-open-url-${id}`);

    if (btn) {
        if (isRunning) {
            btn.innerHTML = '<i class="fas fa-stop text-xs"></i> Stop';
            btn.className = "flex-1 py-2 px-3 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 text-sm font-medium flex items-center justify-center gap-2";
            btn.setAttribute('onclick', `window.stopDevRepo('${id}')`);
            
            // Show Open Button
            if(openBtn) {
                openBtn.classList.remove('hidden');
                openBtn.classList.add('flex');
            }

        } else {
            btn.innerHTML = '<i class="fas fa-play text-xs"></i> Start Dev';
            btn.className = "flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm font-medium flex items-center justify-center gap-2";
            btn.setAttribute('onclick', `window.startDevRepo('${id}')`);
            
            // Hide Open Button
            if(openBtn) {
                openBtn.classList.add('hidden');
                openBtn.classList.remove('flex');
            }
        }
    }
};

window.startDevRepo = function(id) {
    const data = window.repoCache[id];

    if (data && window.TabTerminal) {
        window.TabTerminal.createTab(id, data);
        window.updateCardState(id, true);
    } else {
        console.error('Data or TabTerminal not found', id, data);
    }
};

window.stopDevRepo = function(id) {
    const data = window.repoCache[id];
    if (data && window.TabTerminal) {

    //before closing we need to disable the button to prevent spamming
        window.disableBtnRepo(id);

        window.TabTerminal.closeTab(id, data.name, data.stopcmd, data.path);
        // State update handled by UI triggers or manual?
        // Close tab logic removes the tab. We need to update button back.
        //window.updateCardState(id, false);
    }
};

window.enableBtnRepo = function(id) {
    const btn = document.getElementById(`btn-action-${id}`);
    btn.disabled = false;
    btn.style.cursor = "pointer";
    btn.style.opacity = "1";
}

window.disableBtnRepo = function(id) {
    const btn = document.getElementById(`btn-action-${id}`);
    btn.disabled = true;
    btn.style.cursor = "not-allowed";
    btn.style.opacity = "0.6";
}

window.saveRepo = async function() {
    const id = window.activeSettingsId;
    if (!id) return;

    const data = {
        icon: document.getElementById('modal-input-icon').value,
        description: document.getElementById('modal-input-desc').value,
        devurl: document.getElementById('modal-input-devurl').value,
        produrl: document.getElementById('modal-input-produrl').value,
        startcmd: document.getElementById('modal-input-start').value,
        stopcmd: document.getElementById('modal-input-stop').value,
        buildcmd: document.getElementById('modal-input-build').value,
        lintcmd: document.getElementById('modal-input-lint').value,
        giturl: document.getElementById('modal-input-giturl').value,
        gitorigin: document.getElementById('modal-input-gitorigin').value,
        gitbranch: document.getElementById('modal-input-gitbranch').value,
    };
    
    try {
        const res = await fetch('/api/repository/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, data })
        });
        const json = await res.json();
        if (json.success) {
            await window.loadRepositoryData();
            window.closeSettingsModal();
        } else {
            alert('Failed to save: ' + (json.error || 'Unknown error'));
        }
    } catch (e) {
        alert('Error saving: ' + e.message);
    }
};

window.deleteRepo = async function() {
    const id = window.activeSettingsId;
    if (!id) return;

    if (confirm("Delete method can also by reverse by GIT, continue?")) {
        try {
            const res = await fetch('/api/repository/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const json = await res.json();
            if (json.success) {
                await window.loadRepositoryData();
                window.closeSettingsModal();
            } else {
                alert('Failed to delete: ' + (json.error || 'Unknown error'));
            }
        } catch (e) {
            alert('Error deleting: ' + e.message);
        }
    }
};
