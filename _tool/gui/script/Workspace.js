window.workspaceLoader = async () => {
    try {
        if( !window.workspaceNewHTML || !window.workspaceOptionsHTML || !window.workspaceCardHTML ) {
            const [newRepoHtml, optsRepoHtml, cardRepoHtml] = await Promise.all([
                fetch('/gui/components/WorkspaceNew.html').then(r => r.text()),
                fetch('/gui/components/WorkspaceOption.html').then(r => r.text()),
                fetch('/gui/components/WorkspaceCard.html').then(r => r.text())
            ]);
            window.workspaceNewHTML     = newRepoHtml;
            window.workspaceOptionsHTML = optsRepoHtml;
            window.workspaceCardHTML    = cardRepoHtml;
        }
        document.getElementById('mount-workspace-new').innerHTML     = window.workspaceNewHTML;
        document.getElementById('mount-workspace-options').innerHTML = window.workspaceOptionsHTML;
    } catch (e) {
        console.error('Error loading modal components', e);
    }
    
    if(!window.cardRenderer) {
        window.cardRenderer = new WorkspaceCard(window.workspaceCardHTML);
    }

    // Init Terminal in this view
    if (window.TabTerminal) {
        const mount = document.getElementById('workspace-terminal-mount');
        if (mount) {
            await window.TabTerminal.init(mount);
        }
    }
    await window.loadWorkspaceData();
}

 window.loadWorkspaceData = async function() {
    if (!window.cardRenderer) return;

    try {
        const response = await fetch('/api/workspace', { cache: "no-store" });
        if(!response.ok) throw new Error('API Error');
        const data   = await response.json();
        let hasItems = false;

        window.workspaceSections.forEach(section => {
            const items     = data[ section];
            const container = document.getElementById(`container-${section}`);
            const countEl   = document.getElementById(`count-${section}`);

            if (items && items.length > 0 && container) {
                hasItems = true;
                countEl.textContent = items.length;
                let html = '';
                items.forEach((item, index) => {
                    const uniqueId = `${section}-${index}`;
                    html += window.cardRenderer.render(item, uniqueId);
                });
                container.innerHTML = html;
            } else if (container) {
                container.innerHTML = '';
                countEl.textContent = '0';
            }
        });

        if (!hasItems) {
            document.getElementById('empty-state').classList.remove('hidden');
        } else {
            document.getElementById('empty-state').classList.add('hidden');
        }

    } catch (error) {
        console.error('Error loading workspace data:', error);
        document.getElementById('empty-state').querySelector('p').textContent = 'Error loading data: ' + error.message;
        document.getElementById('empty-state').classList.remove('hidden');
    }
};