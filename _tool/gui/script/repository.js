(async function() {
    console.log('Repo script loaded');
    const sections = ['backend', 'database', 'service', 'frontend'];
    
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

    const cardRenderer = new RepositoryCard(cardTemplate);

    // Fetch Data
    try {
        const response = await fetch('/api/repository');
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
                sectionEl.classList.remove('hidden');
                sectionEl.classList.add('animate-fade-in'); // Add animation class if not present
                countEl.textContent = items.length;

                let html = '';
                items.forEach((item, index) => {
                    html += cardRenderer.render(item, index);
                });
                container.innerHTML = html;
            }
        });

        if (!hasItems) {
            document.getElementById('empty-state').classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error loading repository data:', error);
        // Show error state
         document.getElementById('empty-state').querySelector('p').textContent = 'Error loading data: ' + error.message;
         document.getElementById('empty-state').classList.remove('hidden');
    }

})();
