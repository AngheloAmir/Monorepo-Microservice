window.repositoryLoader = async () => {
    try {
        if( !window.repoNewHTML || !window.repoOptionsHTML || !window.repoCardHTML ) {
            const [newRepoHtml, optsRepoHtml, cardRepoHtml] = await Promise.all([
                fetch('/gui/components/repoNew.html').then(r => r.text()),
                fetch('/gui/components/repoOption.html').then(r => r.text()),
                fetch('/gui/components/repositorycard.html').then(r => r.text())
            ]);
            window.repoNewHTML     = newRepoHtml;
            window.repoOptionsHTML = optsRepoHtml;
            window.repoCardHTML    = cardRepoHtml;
        }
        document.getElementById('mount-repo-new').innerHTML     = window.repoNewHTML;
        document.getElementById('mount-repo-options').innerHTML = window.repoOptionsHTML;
    } catch (e) {
        console.error('Error loading modal components', e);
    }
    
    if(!window.cardRenderer) {
        window.cardRenderer = new RepositoryCard(window.repoCardHTML);
    }

    // Init Terminal in this view
    if (window.TabTerminal) {
        const mount = document.getElementById('repo-terminal-mount');
        if (mount) {
            await window.TabTerminal.init(mount);
        }
    }
    await window.loadRepositoryData();
}

 window.loadRepositoryData = async function() {
    if (!window.cardRenderer) return;

    try {
        const response = await fetch('/api/repository', { cache: "no-store" });
        if(!response.ok) throw new Error('API Error');
        const data   = await response.json();
        let hasItems = false;

        window.repoSections.forEach(section => {
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
        console.error('Error loading repository data:', error);
        document.getElementById('empty-state').querySelector('p').textContent = 'Error loading data: ' + error.message;
        document.getElementById('empty-state').classList.remove('hidden');
    }
};