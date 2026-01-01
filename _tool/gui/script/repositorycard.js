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
        
        html = html.replace('<button class="flex-1', `<button onclick="window.startDevRepo('${id}')" class="flex-1`);

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

window.startDevRepo = function(id) {
    const data = window.repoCache[id];
    if (data && window.TabTerminal) {
        window.TabTerminal.createTab(data);
    } else {
        console.error('Data or TabTerminal not found', id, data);
    }
};
