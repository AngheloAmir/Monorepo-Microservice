class WorkspaceCard {
    constructor(template) {
        this.template = template;
    }

    static getStopButton(id) {
        return `<button onclick="window.stopDevRepo('${id}')" class="flex-1 py-2 px-3 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 text-sm font-medium flex items-center justify-center gap-2 animate-fade-in">
                    <i class="fas fa-stop text-xs"></i> Stop
                </button>`;
    }

    static getStartButtons(id, data) {
        let html = '';
        // Start Button (Production)
        if (data.startcmd && data.startcmd.trim() !== '' && data.startcmd !== 'npm run dev') {
             html += `<button onclick="window.startProdRepo('${id}')" class="flex-1 py-2 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 text-sm font-medium flex items-center justify-center gap-2">
                    <i class="fas fa-play text-xs"></i> Start
                </button>`;
        }
        // Dev Button (Development)
        if (data.devcmd && data.devcmd.trim() !== '') {
             html += `<button onclick="window.startDevRepo('${id}')" class="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm font-medium flex items-center justify-center gap-2">
                        <i class="fas fa-code text-xs"></i> Dev
                    </button>`;
        }
        return html;
    }

    render(data, index) {
        let html   = this.template;
        const processID             = data.type + '-' + data.name;
        const uniqueID              = processID; 
        window.repoCache            = window.repoCache || {};
        window.repoCache[uniqueID]  = data;
        
        const isRunning             = 
                window.TabTerminal && 
                window.TabTerminal.isRunning && 
                window.TabTerminal.isRunning(processID);
        
        let buttonsHtml = '';
        if (isRunning) {
            buttonsHtml = WorkspaceCard.getStopButton(uniqueID);
        } else {
            buttonsHtml = WorkspaceCard.getStartButtons(uniqueID, data);
        }

        // Replace the placeholder with the button container
        html = html.replace('{action_buttons}', `<div id="btns-container-${uniqueID}" class="flex-1 flex gap-2">${buttonsHtml}</div>`);

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
        // Start cmd might need fallback for UI display if needed, but logic is handled by getStartButtons
        html = html.replace(/{startcmd}/g, data.startcmd || 'npm run start');
        html = html.replace(/{stopcmd}/g, data.stopcmd || 'npm run stop');
        html = html.replace(/{buildcmd}/g, data.buildcmd || 'npm run build');
        html = html.replace(/{lintcmd}/g, data.lintcmd || 'npm run lint');
        html = html.replace(/{testcmd}/g, data.testcmd || 'npm run test');
        html = html.replace(/{template}/g, data.template || 'None');
        
        return html;
    }
}

window.updateCardState = function(id, isRunning) {
    const container = document.getElementById(`btns-container-${id}`);
    const openBtn   = document.getElementById(`btn-open-url-${id}`);
    const data      = window.repoCache[id];

    if (container && data) {
        if (isRunning) {
            container.innerHTML = WorkspaceCard.getStopButton(id);
            // Show Open Button
            if(openBtn) {
                openBtn.classList.remove('hidden');
                openBtn.classList.add('flex');
            }
        } else {
            container.innerHTML = WorkspaceCard.getStartButtons(id, data);
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
        const runtimeData = { ...data };
        // Explicitly set startcmd to devcmd
        runtimeData.startcmd = runtimeData.devcmd || 'npm run dev';

        window.TabTerminal.createTab(id, runtimeData);
        window.disableBtnContainer(id);

        setTimeout(() => {
            window.enableBtnContainer(id);
            window.updateCardState(id, true);
        }, 1000);
    } else {
        console.error('Data or TabTerminal not found', id, data);
    }
};

window.startProdRepo = function(id) {
    const data = window.repoCache[id];
    if (data && window.TabTerminal) {
        const runtimeData = { ...data };
        // Use actual startcmd
        runtimeData.startcmd = runtimeData.startcmd || 'npm run start';

        window.TabTerminal.createTab(id, runtimeData);
        window.disableBtnContainer(id);

        setTimeout(() => {
            window.enableBtnContainer(id);
            window.updateCardState(id, true);
        }, 1000);
    } else {
        console.error('Data or TabTerminal not found', id, data);
    }
};

window.stopDevRepo = function(id) {
    const data = window.repoCache[id];
    if (data && window.TabTerminal) {
        window.disableBtnContainer(id);
        
        // Pass stopcmd if available
        window.TabTerminal.closeTab(id, data.name, data.stopcmd, data.path);
    }
};

window.enableBtnContainer = function(id) {
    const container = document.getElementById(`btns-container-${id}`);
    if(!container) return;
    const btns = container.querySelectorAll('button');
    btns.forEach(btn => {
        btn.disabled = false;
        btn.style.cursor = "pointer";
        btn.style.opacity   = "1";
    });
}

window.disableBtnContainer = function(id) {
    const container = document.getElementById(`btns-container-${id}`);
    if(!container) return;
    const btns = container.querySelectorAll('button');
    btns.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = "not-allowed";
        btn.style.opacity   = "0.6";
    });
}

