class RepositoryCard {
    constructor(template) {
        this.template = template;
    }

    render(data, index) {
        let html = this.template;
        const id = `repo-${index}-${Date.now()}`;
        
        // Basic replacements
        html = html.replace(/{id}/g, id);
        html = html.replace(/{name}/g, data.name || 'Untitled');
        html = html.replace(/{description}/g, data.description || 'No description');
        html = html.replace(/{icon}/g, data.icon || 'fas fa-cube');
        html = html.replace(/{branch}/g, data.branch || 'main');
        html = html.replace(/{path}/g, data.path || './');
        html = html.replace(/{type}/g, data.type || 'generic');
        html = html.replace(/{devurl}/g, data.devurl || '#');
        html = html.replace(/{produrl}/g, data.produrl || '#');
        html = html.replace(/{startcmd}/g, data.startcmd || 'npm start');
        html = html.replace(/{stopcmd}/g, data.stopcmd || 'npm run stop');
        html = html.replace(/{buildcmd}/g, data.buildcmd || 'npm run build');
        html = html.replace(/{init}/g, data.init || 'npm init');

        return html;
    }
}

// Global toggle function for the details popup
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
