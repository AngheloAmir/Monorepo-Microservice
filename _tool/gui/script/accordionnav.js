window.AccordionNav = {
    init: async function(containerId, data) {
        this.data = data; // Store for access
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
            const arrowIcon = catNode.querySelector('.fa-chevron-right');
            const folderIcon = catNode.querySelector('.fa-folder');
            
            title.textContent = category.category;
            
            // Restore State
            if (window.crudState.expandedCategories.has(catIndex)) {
                content.classList.remove('hidden');
                arrowIcon.style.transform = 'rotate(90deg)';
                folderIcon.classList.add('text-blue-400', 'opacity-100');
            }

            // Toggle Logic
            header.onclick = () => {
                const isHidden = content.classList.contains('hidden');
                if (isHidden) {
                    content.classList.remove('hidden');
                    arrowIcon.style.transform = 'rotate(90deg)';
                    folderIcon.classList.add('text-blue-400', 'opacity-100'); 
                    window.crudState.expandedCategories.add(catIndex);
                } else {
                    content.classList.add('hidden');
                    arrowIcon.style.transform = 'rotate(0deg)';
                    folderIcon.classList.remove('text-blue-400', 'opacity-100');
                    window.crudState.expandedCategories.delete(catIndex);
                }
            };
            
            // Render Items
            if (category.items) {
                category.items.forEach((item, itemIndex) => {
                    const el = this.createItemElement(item, catIndex, itemIndex);
                    // Insert before the last child (Add Route button)
                    if (content.lastElementChild) {
                        content.insertBefore(el, content.lastElementChild);
                    } else {
                        content.appendChild(el);
                    }
                });
            }
            
            // Add Route Button Logic
            const addRouteBtn = catNode.querySelector('.add-route-btn');
            if (addRouteBtn) {
                addRouteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (window.CrudEditor) {
                        window.CrudEditor.create(catIndex);
                    }
                };
            }

            container.appendChild(catNode);
        });
        
        // Add Category Button
        const addCatBtn = document.createElement('div');
        addCatBtn.className = 'mt-4 px-2 mb-8';
        addCatBtn.innerHTML = `
            <button class="w-full border border-dashed border-gray-700 hover:border-blue-500/50 text-gray-500 hover:text-blue-400 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 group bg-gray-800/20 hover:bg-blue-500/5">
                <i class="fas fa-folder-plus group-hover:scale-110 transition-transform"></i>
                Add Category
            </button>
        `;
        addCatBtn.onclick = async () => {
            const name = prompt("Enter new category name:");
            if (name) {
                try {
                    const res = await fetch('/api/crudedit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'add_category',
                            itemData: { category: name }
                        })
                    });
                    const result = await res.json();
                    if (result.success) {
                        if (window.loadCrudData) {
                            window.loadCrudData();
                        } else {
                            window.location.reload();
                        }
                    } else {
                        alert('Error: ' + result.error);
                    }
                } catch(e) {
                    console.error(e);
                    alert("Network error");
                }
            }
        };
        container.appendChild(addCatBtn);
    },

    createItemElement: function(item, catIndex, itemIndex) {
        const el = document.createElement('div');
        
        // Base classes
        let classes = 'flex items-center gap-2 px-1.5 py-1 rounded-md group text-xs cursor-pointer transition-all duration-200 nav-item-row mb-0.5 ';
        
        // Check Active State
        const isActive = window.crudState.currentItem && 
                         window.crudState.currentItem.route === item.route && 
                         window.crudState.currentItem.methods === item.methods;

        if (isActive) {
            classes += 'bg-blue-600/20 text-blue-200 border border-blue-500/30 shadow-sm'; 
        } else {
            classes += 'text-gray-400 hover:bg-gray-800 hover:text-gray-100 border border-transparent';
        }

        el.className = classes;

        el.onclick = () => {
             // Update Global State
             window.crudState.currentItem = item;

             // Update UI Visually (Remove active from others, add to this)
             document.querySelectorAll('.nav-item-row').forEach(row => {
                 row.classList.remove('bg-blue-600/20', 'text-blue-200', 'border-blue-500/30', 'shadow-sm');
                 row.classList.add('text-gray-400', 'hover:bg-gray-800', 'hover:text-gray-100', 'border-transparent');
             });
             el.classList.remove('text-gray-400', 'hover:bg-gray-800', 'hover:text-gray-100', 'border-transparent');
             el.classList.add('bg-blue-600/20', 'text-blue-200', 'border-blue-500/30', 'shadow-sm');

             if (window.CrudTest && window.CrudTest.selectItem) {
                 window.CrudTest.selectItem(item);
             }
        };
        
        const methodColor = this.getMethodColor(item.methods);
        const method = item.methods || 'GET';

        el.innerHTML = `
            <span class="font-black font-mono w-10 flex-none text-[10px] ${methodColor} opacity-90">${method.toUpperCase()}</span>
            <span class="flex-1 truncate font-medium" title="${item.label}">${item.label}</span>
            <button class="opacity-0 group-hover:opacity-100 p-1 hover:text-white text-gray-500 transition-opacity" 
                    title="Edit"
                    onclick="event.stopPropagation(); window.CrudEditor.open(${catIndex}, ${itemIndex})">
                <i class="fas fa-pen text-[10px]"></i>
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
    },

    deselectAll: function() {
         window.crudState.currentItem = null;
         document.querySelectorAll('.nav-item-row').forEach(row => {
             row.classList.remove('bg-blue-600/20', 'text-blue-200', 'border-blue-500/30', 'shadow-sm');
             row.classList.add('text-gray-400', 'hover:bg-gray-800', 'hover:text-gray-100', 'border-transparent');
         });
    }
};
