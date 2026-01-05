window.Navigation = {
    items: [
        { id: 'home',       label: 'Home', icon: 'fa-home', component: 'home' },
        { id: 'workspace',  label: 'Workspace', icon: 'fa fa-cube', component: 'workspace' },
        { id: 'turborepo',  label: 'Turborepo', icon: 'fa-solid fa-truck-fast', component: 'turborepo' },
        { id: 'turbocicd',  label: 'Turbo CI/CD', icon: 'fa-server',              component: 'turbocicd' },
        
        { id: 'crudtester', label: 'CRUD Tester', icon: 'fa-microscope', component: 'crudtester' },

    ],
    settingsItem: { id: 'settings', label: 'Setting', icon: 'fa-cog', component: 'settings' },
    activeId: null, // Start null so first navigation always triggers load
    
    init: function() {
        this.render();
        this.navigateTo('home');
    },

    render: function() {
        const navContainer = document.getElementById('main-nav');
        if (!navContainer) return;
        navContainer.style.zIndex = "50";

        // Top items
        let html = '<div class="relative z-[999999] flex flex-col gap-2 w-full px-2">';
        this.items.forEach(item => {
            html += this.createNavItem(item);
        });
        html += '</div>';

        // Bottom setting item
        html += '<div class="mt-auto w-full p-2 border-t border-gray-800">';
        html += this.createNavItem(this.settingsItem);
        html += '</div>';

        navContainer.innerHTML = html;
        
        // Add event listeners
        navContainer.querySelectorAll('.nav-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id');
                this.navigateTo(id);
            });
        });
    },
    
    createNavItem: function(item) {
        const isActive = this.activeId === item.id;
        // Styles:
        // - Base: group relative flex items-center justify-center ...
        // - Active: bg-blue-600 text-white
        // - Inactive: text-gray-400 hover:bg-gray-800 hover:text-white
        // - Tooltip: absolute left-full
        
        const activeClass = isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-500' 
            : 'text-gray-400 hover:bg-gray-800 hover:text-white';
        
        return `<button 
                    class="z-50 nav-item group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500/50 ${activeClass}" 
                    data-id="${item.id}"
                    aria-label="${item.label}"
                >
                    <i class="fas ${item.icon} text-lg transition-transform duration-200 group-hover:scale-110"></i>
                    
                    <!-- Tooltip -->
                    <div class="z-50 absolute bg-gray-900 left-14 px-3 py-1.5 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-x-2 group-hover:translate-x-0 shadow-xl border border-gray-700 whitespace-nowrap">
                        ${item.label}
                        <!-- Arrow -->
                        <div class="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-b border-gray-700 rotate-45"></div>
                    </div> 
                </button>`;
    },
    
    navigateTo: async function(id) {
        await window.PageLoader.load(id); 

        switch(id) {
            case 'workspace':
                await window.workspaceLoader();
                break;
            case 'crudtester':
                if (window.crudTesterLoader) await window.crudTesterLoader();
                break;
            default:
                break;
        }

        //update the looks of the navigation
        this.activeId = id;
        this.render();
    }
};
