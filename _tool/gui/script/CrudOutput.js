window.CrudOutput = {
    create: async function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        let template = document.getElementById('crud-output-template');
        if (!template) {
             const res = await fetch('/gui/components/CrudOutput.html');
             const text = await res.text();
             const div = document.createElement('div');
             div.innerHTML = text;
             div.firstElementChild.id = 'crud-output-template'; 
             document.body.appendChild(div.firstElementChild);
             template = document.getElementById('crud-output-template');
             template.classList.add('hidden');
        }

        const clone = template.cloneNode(true);
        clone.id = ''; 
        clone.classList.remove('hidden');
        
        const contentEl = clone.querySelector('#output-content');
        
        // Save/Load Logic
        clone.querySelector('#btn-save').onclick = () => {
             const raw = contentEl.dataset.raw || contentEl.innerText;
             localStorage.setItem('crud-output-last', raw);
             alert('Output saved to LocalStorage');
        };

        clone.querySelector('#btn-load').onclick = () => {
             const saved = localStorage.getItem('crud-output-last');
             if(saved) this.setValue(contentEl, saved);
             else alert('No saved output found');
        };

        container.appendChild(clone);

        return {
            element: clone,
            setValue: (val) => this.setValue(contentEl, val)
        };
    },

    setValue: function(el, value) {
        // Store raw value for saving
        if (typeof value === 'object') {
            value = JSON.stringify(value, null, 2);
        }
        el.dataset.raw = value;
        
        // Highlight logic
        // Attributes: Green
        // Punctuation: Orange
        // Background Black (handled by CSS)
        // Text White (handled by CSS)
        
        let html = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Keys: "key": -> green
        html = html.replace(/"([^"]+)":/g, '<span class="text-green-500">"$1"</span>:');
        
        // Punctuation: [ ] { } , " -> orange
        // Note: We need to avoid replacing quotes inside the span tags we just added!
        // Strategy: First highlight string values, then keys, then punctuation?
        // Or simpler regex that avoids tags.
        
        // Let's try replacing punctuation not inside tags. 
        // Simple hack: Replace specific chars that are definitely structural JSON
        html = html.replace(/([{}\[\],])/g, '<span class="text-orange-500">$1</span>');
        
        // Re-coloring the colon to white or default if needed, currently it might be plain text
        
        el.innerHTML = html;
    }
};
