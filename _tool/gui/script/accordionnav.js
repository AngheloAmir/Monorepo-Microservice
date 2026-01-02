window.AccordionNav = {
    init: async function(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let template = document.getElementById('accordion-nav-template');
        // Fallback if not injected by crudtest.js loader (though it should be)
        if (!template) {
             const res = await fetch('/gui/components/accordionnav.html');
             const text = await res.text();
             const div = document.createElement('div');
             div.innerHTML = text;
             template = div.querySelector('#accordion-nav-template');
             document.body.appendChild(template);
        }

        this.render(container, data, template);
    },

    render: function(container, data, template) {
        container.innerHTML = '';
        
        // Ensure state exists
        if (!window.crudState) window.crudState = { expandedCategories: new Set(), currentItem: null };

        data.forEach((category, catIndex) => {
            const clone = template.cloneNode(true);
            const catNode = clone.querySelector('.accordion-category');
            
            const header = catNode.querySelector('.accordion-header');
            const content = catNode.querySelector('.accordion-content');
            const title = catNode.querySelector('.category-title');
            const icon = catNode.querySelector('.fa-chevron-right');
            
            title.textContent = category.category;
            
            // Restore State
            if (window.crudState.expandedCategories.has(catIndex)) {
                content.classList.remove('hidden');
                icon.style.transform = 'rotate(90deg)';
            }

            // Toggle Logic
            header.onclick = () => {
                const isHidden = content.classList.contains('hidden');
                if (isHidden) {
                    content.classList.remove('hidden');
                    icon.style.transform = 'rotate(90deg)';
                    window.crudState.expandedCategories.add(catIndex);
                } else {
                    content.classList.add('hidden');
                    icon.style.transform = 'rotate(0deg)';
                    window.crudState.expandedCategories.delete(catIndex);
                }
            };
            
            // Render Items
            if (category.items) {
                category.items.forEach((item, itemIndex) => {
                    const el = this.createItemElement(item, catIndex, itemIndex);
                    content.appendChild(el);
                });
            }
            
            container.appendChild(catNode);
        });
    },

    createItemElement: function(item, catIndex, itemIndex) {
        const el = document.createElement('div');
        
        // Base classes
        let classes = 'flex items-center gap-2 p-1.5 rounded group text-xs cursor-pointer transition-colors nav-item-row ';
        
        // Check Active State
        const isActive = window.crudState.currentItem && 
                         window.crudState.currentItem.route === item.route && 
                         window.crudState.currentItem.methods === item.methods;

        if (isActive) {
            classes += 'bg-gray-700 text-white'; // Active bg
        } else {
            classes += 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'; // Inactive hover
        }

        el.className = classes;

        el.onclick = () => {
             // Update Global State
             window.crudState.currentItem = item;

             // Update UI Visually (Remove active from others, add to this)
             document.querySelectorAll('.nav-item-row').forEach(row => {
                 row.classList.remove('bg-gray-700', 'text-white');
                 row.classList.add('text-gray-400', 'hover:bg-gray-700', 'hover:text-gray-200');
             });
             el.classList.remove('text-gray-400', 'hover:bg-gray-700', 'hover:text-gray-200');
             el.classList.add('bg-gray-700', 'text-white');

             if (window.CrudTest && window.CrudTest.selectItem) {
                 window.CrudTest.selectItem(item);
             }
        };
        
        const methodColor = this.getMethodColor(item.methods);
        const method = item.methods || 'GET';

        el.innerHTML = `
            <span class="font-mono font-bold w-12 flex-none ${methodColor}">${method.toUpperCase()}</span>
            <span class="flex-1 truncate opacity-90" title="${item.label}">${item.label}</span>
            <button class="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-opacity" 
                    title="Edit"
                    onclick="event.stopPropagation(); window.CrudEditor.open(${catIndex}, ${itemIndex})">
                <i class="fas fa-edit"></i>
            </button>
        `;
        return el;
    },

    getMethodColor: function(method) {
        if (!method) return 'text-gray-500';
        switch(method.toUpperCase()) {
            case 'GET': return 'text-green-500';
            case 'POST': return 'text-blue-500';
            case 'PUT': return 'text-violet-500';
            case 'DELETE': return 'text-red-500';
            case 'PATCH': return 'text-purple-500';
            case 'STREAM': return 'text-orange-500';
            default: return 'text-gray-500';
        }
    }
};
