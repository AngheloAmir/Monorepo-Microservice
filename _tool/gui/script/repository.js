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

// --- Modal Logic ---
let selectedType = 'service';

window.openAddModal = function() {
    document.getElementById('add-repo-modal').classList.remove('hidden');
};

window.closeAddModal = function() {
    document.getElementById('add-repo-modal').classList.add('hidden');
};

window.selectType = function(type) {
    selectedType = type;
    
    // Reset all buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active', 'border-blue-500', 'bg-blue-500/10');
        btn.classList.add('border-gray-700', 'bg-gray-900/50');
    });

    // Activate selected
    const activeBtn = document.querySelector(`.type-btn[data-type="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('border-gray-700', 'bg-gray-900/50');
        activeBtn.classList.add('active', 'border-blue-500', 'bg-blue-500/10');
    }
};

window.toggleTemplateMenu = async function() {
    const menu = document.getElementById('template-menu');
    const list = document.getElementById('template-list');
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        
        // Load templates if needed
        if (list.children.length <= 1) { 
            try {
                const res = await fetch('/api/repotemplate');
                if (res.ok) {
                    const templates = await res.json();
                    renderTemplates(templates);
                } else {
                    list.innerHTML = '<div class="p-2 text-red-400 text-xs">Failed to load templates</div>';
                }
            } catch (e) {
                console.error(e);
                list.innerHTML = '<div class="p-2 text-red-400 text-xs">Error loading templates</div>';
            }
        }
    } else {
        menu.classList.add('hidden');
    }
};

function renderTemplates(templates) {
    const list = document.getElementById('template-list');
    list.innerHTML = '';
    
    templates.forEach(t => {
        const div = document.createElement('div');
        div.className = 'p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0 transition-colors';
        div.innerHTML = `
            <div class="text-sm text-white font-medium mb-1">${t.title}</div>
            <div class="text-xs text-gray-500 font-mono bg-gray-900 p-1.5 rounded truncate">${t.command}</div>
        `;
        div.onclick = () => {
            selectTemplate(t);
        };
        list.appendChild(div);
    });
    
    if (templates.length === 0) {
         list.innerHTML = '<div class="p-4 text-center text-gray-500 text-xs">No templates found</div>';
    }
}

function selectTemplate(template) {
    // Fill init command
    document.getElementById('repo-init').value = template.command;
    
    // Close menu
    document.getElementById('template-menu').classList.add('hidden');
}

window.createRepository = function() {
    const data = {
        name: document.getElementById('repo-name').value,
        description: document.getElementById('repo-desc').value,
        icon: document.getElementById('repo-icon').value,
        type: selectedType,
        devurl: document.getElementById('repo-devurl').value,
        startcmd: document.getElementById('repo-start').value,
        stopcmd: document.getElementById('repo-stop').value,
        buildcmd: document.getElementById('repo-build').value,
        init: document.getElementById('repo-init').value,
    };
    
    console.log('Creating Repository:', data);
    
    // Here you would typically send this to the backend
    
    closeAddModal();
    alert('Repository creation simulated. Check console for data.');
};
