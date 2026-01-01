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
             // We construct a specific regex to find the button containing "Start Dev"
             // Assuming the template corresponds to Step 80 content
             // <button class="flex-1 ..."> ... Start Dev ... </button>
             
             // Let's replace the innerHTML of `repositorycard.html` where the button is defined in Step 80?
             // No, we are in JS.
             
             // Hacky but effective: replace the whole expected button class string start
             // Or better, just inject the ID logic again but handle text change.
             
             // Since we have full control over `btnHtml`, let's try to swap the standard button.
             // Standard button signature from template:
             // <button class="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm font-medium flex items-center justify-center gap-2">
             //    <i class="fas fa-play text-xs"></i> Start Dev
             // </button>
             
             // We can replace "Start Dev" text and "bg-blue-600" classes conditionally?
             // Too messy.
             
             // Let's use the replacement to inject the ID and Onclick, then use DOM manipulation after render? No, render returns string.
             
             // Let's just generate the button HTML and replace the hardcoded button string in the template.
             // We need to match the start of the button tag.
             const btnStartMarker = '<button class="flex-1';
             const btnEndMarker = '</button>';
             
             // Locate start
             const idx1 = html.indexOf(btnStartMarker);
             if (idx1 !== -1) {
                 const idx2 = html.indexOf(btnEndMarker, idx1);
                 if (idx2 !== -1) {
                     const originalBtn = html.substring(idx1, idx2 + btnEndMarker.length);
                     // Replace it entirely
                     html = html.replace(originalBtn, btnHtml);
                 }
             }
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

// Global toggle function
window.toggleDetails = function(id) {
    const el = document.getElementById(`details-${id}`);
    const card = document.getElementById(`card-${id}`);
    
    if (el) {
        // Toggle visibility
        const isHidden = el.classList.contains('hidden');
        
        // Close all others first
        document.querySelectorAll('[id^="details-"]').forEach(item => {
            item.classList.add('hidden');
        });
        document.querySelectorAll('[id^="card-"]').forEach(item => {
            item.classList.remove('z-[50]');
            item.classList.add('z-0');
        });

        if (isHidden) {
            el.classList.remove('hidden');
            if (card) {
                card.classList.remove('z-0');
                card.classList.add('z-[50]');
            }
        }
    }
};

window.updateCardState = function(id, isRunning) {
    const btn = document.getElementById(`btn-action-${id}`);
    if (!btn) return;
    
    if (isRunning) {
        btn.innerHTML = '<i class="fas fa-stop text-xs"></i> Stop';
        btn.className = "flex-1 py-2 px-3 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 text-sm font-medium flex items-center justify-center gap-2";
        btn.setAttribute('onclick', `window.stopDevRepo('${id}')`);
    } else {
        btn.innerHTML = '<i class="fas fa-play text-xs"></i> Start Dev';
        btn.className = "flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm font-medium flex items-center justify-center gap-2";
        btn.setAttribute('onclick', `window.startDevRepo('${id}')`);
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
