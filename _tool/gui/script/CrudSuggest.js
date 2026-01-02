window.CrudSuggest = {
    create: async function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        let template = document.getElementById('crud-suggest-template');
        if (!template) {
             const res = await fetch('/gui/components/CrudSuggest.html');
             const text = await res.text();
             const div = document.createElement('div');
             div.innerHTML = text;
             div.firstElementChild.id = 'crud-suggest-template';
             document.body.appendChild(div.firstElementChild);
             template = document.getElementById('crud-suggest-template');
             template.classList.add('hidden');
        }

        const clone = template.cloneNode(true);
        clone.id = ''; 
        clone.classList.remove('hidden');
        
        const contentEl = clone.querySelector('#suggest-content');
        const wrapper   = clone;
        const icon      = clone.querySelector('#btn-toggle-size i');
        
        // Minimize/Maximize Width Logic
        let isMinimized = false;
        clone.querySelector('#btn-toggle-size').onclick = () => {
             isMinimized = !isMinimized;
             
             const grid = document.getElementById('crud-grid-layout');
             const title = clone.querySelector('.font-bold'); // "SUGGESTED OUTCOME"
             const contentWrapper = clone.querySelector('#suggest-content-wrapper');
             const header = clone.querySelector('.border-b');

             if (isMinimized) {
                 // Minimize: 1fr 1fr 40px
                 if (grid) {
                     grid.classList.remove('grid-cols-3');
                     grid.style.gridTemplateColumns = 'minmax(0, 1fr) minmax(0, 1fr) 40px';
                 }
                 
                 contentWrapper.classList.add('hidden');
                 title.classList.add('hidden');
                 
                 // center button
                 header.classList.remove('justify-between', 'px-2');
                 header.classList.add('justify-center', 'px-0');
                 
                 icon.className = 'fas fa-chevron-left';
             } else {
                 // Restore
                 if (grid) {
                     grid.style.gridTemplateColumns = '';
                     grid.classList.add('grid-cols-3');
                 }
                 
                 contentWrapper.classList.remove('hidden');
                 title.classList.remove('hidden');
                 
                 header.classList.add('justify-between', 'px-2');
                 header.classList.remove('justify-center', 'px-0');
                 
                 icon.className = 'fas fa-expand-alt';
             }
        };

        container.appendChild(clone);

        return {
            element: clone,
            setValue: (val) => this.setValue(contentEl, val)
        };
    },

    setValue: function(el, value) {
        // Highlight lines starting with # as Blue
        // Same highlighting as Output otherwise?
        // User said: "Suggested coloum is also collored like the output, and a starting line is # with make the text blue."
        
        if (typeof value === 'object') {
            value = JSON.stringify(value, null, 2);
        }

        let lines = value.split('\n');
        let processedLines = lines.map(line => {
             if (line.trim().startsWith('#')) {
                 return `<span class="text-blue-500 font-bold">${line}</span>`;
             }
             
             // Apply normal highlighting for non-comment lines
             let html = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
             html = html.replace(/"([^"]+)":/g, '<span class="text-green-500">"$1"</span>:');
             html = html.replace(/([{}\[\],])/g, '<span class="text-orange-500">$1</span>');
             return html;
        });
        
        el.innerHTML = processedLines.join('\n');
    }
};
