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
        html = html.replace(/{buildcmd}/g, data.buildcmd || 'npm run build');

        return html;
    }
}

// Global toggle function for the details accordion
window.toggleDetails = function(id) {
    const el = document.getElementById(`details-${id}`);
    if (el) {
        el.classList.toggle('hidden');
    }
};
