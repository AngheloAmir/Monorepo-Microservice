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
        const wrapper   = clone.querySelector('#suggest-container');
        const icon      = clone.querySelector('#btn-toggle-size i');
        
        // Minimize/Maximize Logic (Toggle height or fullscreen?)
        // User asked for min/max. Let's toggle between flex-1 (default) and h-10 (minimized)
        let isMinimized = false;
        clone.querySelector('#btn-toggle-size').onclick = () => {
             isMinimized = !isMinimized;
             if (isMinimized) {
                 wrapper.classList.remove('flex-1'); // Assuming parent is flex
                 wrapper.style.height = '32px'; // Just header
                 wrapper.querySelector('#suggest-content-wrapper').classList.add('hidden');
                 icon.className = 'fas fa-compress-alt';
             } else {
                 if(wrapper.parentElement.classList.contains('flex')) wrapper.classList.add('flex-1');
                 wrapper.style.height = 'auto'; // restore
                 wrapper.style.height = '100%'; 
                 wrapper.querySelector('#suggest-content-wrapper').classList.remove('hidden');
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
