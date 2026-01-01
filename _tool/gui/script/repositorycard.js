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

