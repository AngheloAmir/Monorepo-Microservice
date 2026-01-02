
{
    let cardRenderer;
    const sections = ['backend', 'database', 'frontend', 'service'];

    async function initRepoPage() {
        console.log('Repo script loaded');
        
        // Load External Modal Components
        try {
            const [newRepoHtml, optsRepoHtml] = await Promise.all([
                fetch('/gui/components/repoNew.html').then(r => r.text()),
                fetch('/gui/components/repoOption.html').then(r => r.text())
            ]);

            document.getElementById('mount-repo-new').innerHTML = newRepoHtml;
            document.getElementById('mount-repo-options').innerHTML = optsRepoHtml;

        } catch (e) {
            console.error('Error loading modal components', e);
        }

        // Fetch Template
        let cardTemplate = '';
        try {
            const response = await fetch('/gui/components/repositorycard.html');
            if(response.ok) {
                cardTemplate = await response.text();
            } else {
                console.error('Failed to load card template');
                return;
            }
        } catch (e) {
            console.error('Error fetching template', e);
            return;
        }

        cardRenderer = new RepositoryCard(cardTemplate);

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
        if (!cardRenderer) return;

        // Clear current state if necessary or let innerHTML replace handle it. 
        // We might want to show a spinner if it takes time, but for now fast replace.

        try {
            const response = await fetch('/api/repository', { cache: "no-store" });
            if(!response.ok) throw new Error('API Error');
            const data = await response.json();
            
            let hasItems = false;

            sections.forEach(section => {
                const items = data[section];
                const container = document.getElementById(`container-${section}`);
                const sectionEl = document.getElementById(`section-${section}`);
                const countEl = document.getElementById(`count-${section}`);

                if (items && items.length > 0 && container) {
                    hasItems = true;
                    // sectionEl.classList.remove('hidden'); // No longer needed as columns are always visible
                    // sectionEl.classList.add('animate-fade-in'); 
                    countEl.textContent = items.length;

                    let html = '';
                    items.forEach((item, index) => {
                        const uniqueId = `${section}-${index}`;
                        html += cardRenderer.render(item, uniqueId);
                    });
                    container.innerHTML = html;
                } else if (container) {
                     // Explicitly handle empty sections
                     // sectionEl.classList.add('hidden'); // Keep columns visible
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
            // Show error state
             document.getElementById('empty-state').querySelector('p').textContent = 'Error loading data: ' + error.message;
             document.getElementById('empty-state').classList.remove('hidden');
        }
    };

    // Start initialization
    initRepoPage();
}
