
// Logic for repoOption.html

window.activeSettingsId = null;

window.openSettingsModal = function(id) {
    const data = window.repoCache[id];
    if (!data) return;

    window.activeSettingsId = id;
    const modal = document.getElementById('repository-settings-modal');
    
    // Populate fields
    //document.getElementById('settings-title-name').textContent = data.name;
    
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
    
    document.getElementById('modal-input-install').value = data.installcmd !== undefined ? data.installcmd : '';
    document.getElementById('modal-input-start').value = data.startcmd !== undefined ? data.startcmd : '';
    document.getElementById('modal-input-stop').value = data.stopcmd !== undefined ? data.stopcmd : '';
    document.getElementById('modal-input-build').value = data.buildcmd !== undefined ? data.buildcmd : '';
    document.getElementById('modal-input-lint').value = data.lintcmd !== undefined ? data.lintcmd : 'npm run lint';
    document.getElementById('modal-input-test').value = data.testcmd !== undefined ? data.testcmd : 'npm run test';

    // Git Config
    document.getElementById('modal-input-giturl').value = data.giturl !== undefined ? data.giturl : '';
    document.getElementById('modal-input-gitorigin').value = data.gitorigin !== undefined ? data.gitorigin : 'origin';
    document.getElementById('modal-input-gitbranch').value = data.gitbranch !== undefined ? data.gitbranch : 'master';
   
    // Show modal
    modal.classList.remove('hidden');
};

window.closeSettingsModal = function() {
    document.getElementById('repository-settings-modal').classList.add('hidden');
    window.activeSettingsId = null;
};

window.saveRepo = async function() {
    const id = window.activeSettingsId;
    if (!id) return;

    const data = {
        name: document.getElementById('modal-text-name').textContent,
        type: document.getElementById('modal-text-type').textContent.toLowerCase(),
        template: document.getElementById('modal-text-template').textContent,
        icon: document.getElementById('modal-input-icon').value,
        description: document.getElementById('modal-input-desc').value,
        devurl: document.getElementById('modal-input-devurl').value,
        produrl: document.getElementById('modal-input-produrl').value,
        installcmd: document.getElementById('modal-input-install').value,
        startcmd: document.getElementById('modal-input-start').value,
        stopcmd: document.getElementById('modal-input-stop').value,
        buildcmd: document.getElementById('modal-input-build').value,
        lintcmd: document.getElementById('modal-input-lint').value,
        testcmd: document.getElementById('modal-input-test').value,
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
            await window.openAlertModal('Error', 'Failed to save: ' + (json.error || 'Unknown error'), 'error');
        }
    } catch (e) {
        await window.openAlertModal('Error', 'Error saving: ' + e.message, 'error');
    }
};

window.deleteRepo = async function() {
    const id = window.activeSettingsId;
    if (!id) return;

    const confirmed = await window.openConfirmModal(
        "Warning", 
        "Delete method can also by reverse by GIT, continue?"
    );

    if (confirmed) {
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
                await window.openAlertModal('Error', 'Failed to delete: ' + (json.error || 'Unknown error'), 'error');
            }
        } catch (e) {
            await window.openAlertModal('Error', 'Error deleting: ' + e.message, 'error');
        }
    }
};
