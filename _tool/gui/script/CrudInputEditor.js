window.CrudInputEditor = {
    create: async function(containerId, title, initialValue = '{}') {
        const container = document.getElementById(containerId);
        if (!container) return null;

        let template = document.getElementById('crud-input-editor-template');
        if (!template) {
             const res = await fetch('/gui/components/CrudInputEditor.html');
             const text = await res.text();
             const div = document.createElement('div');
             div.innerHTML = text;
             // We use the first child as template but we need to clone it for multiple instances
             // Store the HTML string for easier cloning or just use this one
             div.firstElementChild.id = 'crud-input-editor-template'; // trick to ID it
             document.body.appendChild(div.firstElementChild);
             template = document.getElementById('crud-input-editor-template');
             template.classList.add('hidden'); // Hide the template itself
        }

        const clone = template.cloneNode(true);
        clone.id = ''; 
        clone.classList.remove('hidden');
        clone.querySelector('#editor-title').textContent = title;
        
        const editorContent = clone.querySelector('#editor-content');
        this.setValue(editorContent, initialValue);

        // Simple highlight on blur to avoid caret jumping issues during editing
        editorContent.addEventListener('blur', () => {
             this.highlight(editorContent);
        });

        // Also handle paste to clean formatting? For now, default behavior.

        container.appendChild(clone);

        return {
            element: clone,
            editor: editorContent,
            getValue: () => editorContent.innerText,
            setValue: (val) => this.setValue(editorContent, val)
        };
    },

    setValue: function(editor, value) {
        editor.innerText = value;
        this.highlight(editor);
    },

    highlight: function(editor) {
        let text = editor.innerText;
        
        // Helper: escape HTML
        const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Try to Prettify JSON if valid
        try {
            const obj = JSON.parse(text);
            // Prettify
            text = JSON.stringify(obj, null, 2);
        } catch(e) {
            // If invalid JSON, just keep text as is (might be flattened if browser did so, but usually innerText preserves)
        }

        let html = escapeHtml(text);
        
        // Keys: "key": -> key colored orange
        html = html.replace(/"([^"]+)":/g, '<span class="text-orange-500">"$1"</span>:');
        
        editor.innerHTML = html;
    }
};
