window.AccordionNav = {
    init: async function(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let template = document.getElementById('accordion-nav-template');
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
        
        data.forEach((category, catIndex) => {
            const clone = template.cloneNode(true);
            const catNode = clone.querySelector('.accordion-category');
            
            const header = catNode.querySelector('.accordion-header');
            const content = catNode.querySelector('.accordion-content');
            const title = catNode.querySelector('.category-title');
            const icon = catNode.querySelector('.fa-chevron-right');
            
            title.textContent = category.category;
            
            // Toggle Logic
            header.onclick = () => {
                const isHidden = content.classList.contains('hidden');
                if (isHidden) {
                    content.classList.remove('hidden');
                    icon.style.transform = 'rotate(90deg)';
                } else {
                    content.classList.add('hidden');
                    icon.style.transform = 'rotate(0deg)';
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
        el.className = 'flex items-center gap-2 p-1.5 rounded hover:bg-gray-700 group text-xs text-gray-400 cursor-pointer transition-colors';
        el.onclick = () => {
             if (window.CrudTest && window.CrudTest.selectItem) {
                 window.CrudTest.selectItem(item);
             }
        };
        
        const methodColor = this.getMethodColor(item.methods);
        const method = item.methods || 'GET';

        el.innerHTML = `
            <span class="font-mono font-bold w-12 flex-none ${methodColor}">${method.toUpperCase()}</span>
            <span class="flex-1 truncate text-gray-300" title="${item.label}">${item.label}</span>
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
            default: return 'text-gray-500';
        }
    }
};
