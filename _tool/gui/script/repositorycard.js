class RepositoryCard {
    constructor(template) {
        this.template = template;
    }

    render(data, index) {
        let html = this.template;
        const id = data.id !== undefined ? data.id : index;

        // Inject encoded data for the Start Dev button
        // We use a safe way to store the object
        const json = JSON.stringify(data).replace(/"/g, '&quot;');
        html = html.replace('Start Dev', 'Start Dev'); // Placeholder check? No, just replace attribute in button
        
        // Simpler approach: Add an onclick handler call directly if we can serialize properly, 
        // or better, find the button by some marker and replace the attribute. 'class="... Start Dev"' is hard to regex reliably.
        
        // Let's replace the whole button string if possible or use a specific placeholder in template?
        // The user didn't modify template to add a placeholder for actions.
        // We will do a regex replacement for the button tag to add onclick.
        
        // Alternatively, add a temporary placeholder {action_start} in the template in next step? 
        // Or modify the regex here to inject `onclick`
        
        const startAction = `onclick="window.TabTerminal.createTab(${json.replace(/"/g, "'")})"`;
        // Warning: quoting hell. 
        // Better: use window.startDevRepo = function(index) { ... get data from global list ... } ?
        // But we don't store global list index easily here.
        
        // Best: Add ID to button and attach event listener? No, string replacement is current patterns.
        // Let's try replacing the button tag start.
        
        // Target: <button class="... flex items-center justify-center gap-2">
        // It has text "Start Dev" inside.
        
        // Let's modify the HTML replacement to simpler method:
        // We will replacing the text "Start Dev" button's onclick.
        // But the button currently has NO onclick in the template.
        
        // We will replace `<button class="flex-1` with `<button onclick='window.startDevRepo(${JSON.stringify(data)})' class="flex-1`
        // Wait, JSON.stringify in HTML attribute is risky.
        
        // Strategy: Store data in a global cache by ID, pass ID to onclick.
        window.repoCache = window.repoCache || {};
        window.repoCache[id] = data;
        
        // Determine state
        const isRunning = window.TabTerminal && window.TabTerminal.isRunning && window.TabTerminal.isRunning(data.name);
        
        let btnHtml = '';
        if (isRunning) {
             btnHtml = `<button id="btn-action-${id}" onclick="window.stopDevRepo('${id}')" class="flex-1 py-2 px-3 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 text-sm font-medium flex items-center justify-center gap-2">
                <i class="fas fa-stop text-xs"></i> Stop
            </button>`;
        } else {
             btnHtml = `<button id="btn-action-${id}" onclick="window.startDevRepo('${id}')" class="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm font-medium flex items-center justify-center gap-2">
                <i class="fas fa-play text-xs"></i> Start Dev
            </button>`;
        }

        // We replace the entire button if possible, but the template has strict class structure.
        // The previous replace logic was partial. Let's do a cleaner replacement of the whole button block if possible or just the tag.
        
        // Template has: <button class="flex-1 ..."> ... </button>
        // We will try to replace the whole opening tag and inner content until closing tag, but that's hard with regex on arbitrary html.
        // Simpler: The template provided earlier has a specific structure.
        // Let's replace the whole default button string with our generated one.
        // We need to identify the replace target uniquely.
        
        // Use a temporary identifier in template would be best, but we are editing JS.
        // We will replace the partial string again but this time we injection the full ID to manipulate it later.
        
        if (html.includes('Start Dev')) {
             // ... button replacement logic ...
             const btnStartMarker = '<button class="flex-1';
             const btnEndMarker = '</button>';
             
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
        // Defaults to 'hidden'. If running, switch to 'flex'.
        // We match strictly the start of the class string we injected in HTML
        if (isRunning) {
            html = html.replace('class="hidden px-2', 'class="flex px-2');
        }

        // Replace basic placeholders
        // Text replacement handles both attribute injection and content injection
        html = html.replace(/{name}/g, data.name || 'Untitled');
        html = html.replace(/{description}/g, data.description || 'No description');
        html = html.replace(/{icon}/g, data.icon || 'fas fa-cube'); // default icon
        html = html.replace(/{type}/g, data.type || 'service');
        html = html.replace(/{id}/g, id);
        html = html.replace(/{branch}/g, data.branch || 'main'); // Default branch if not provided
        
        // Command replacements
        html = html.replace(/{devurl}/g, data.devurl || '#');
        html = html.replace(/{produrl}/g, data.produrl || '#');
        html = html.replace(/{startcmd}/g, data.startcmd || 'npm run dev');
        html = html.replace(/{stopcmd}/g, data.stopcmd || 'npm run stop');
        html = html.replace(/{buildcmd}/g, data.buildcmd || 'npm run build');
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
   
    // Show modal
    modal.classList.remove('hidden');
};

window.closeSettingsModal = function() {
    document.getElementById('repository-settings-modal').classList.add('hidden');
    window.activeSettingsId = null;
};

window.updateCardState = function(id, isRunning) {
    const btn = document.getElementById(`btn-action-${id}`);
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
        window.TabTerminal.createTab(data);
        window.updateCardState(id, true);
    } else {
        console.error('Data or TabTerminal not found', id, data);
    }
};

window.stopDevRepo = function(id) {
    const data = window.repoCache[id];
    if (data && window.TabTerminal) {
        window.TabTerminal.closeTab(data.name, data.stopcmd, data.path);
        // State update handled by UI triggers or manual?
        // Close tab logic removes the tab. We need to update button back.
        window.updateCardState(id, false);
    }
};

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
