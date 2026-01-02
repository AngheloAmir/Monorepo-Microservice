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
             div.firstElementChild.id = 'crud-input-editor-template';
             document.body.appendChild(div.firstElementChild);
             template = document.getElementById('crud-input-editor-template');
             template.classList.add('hidden');
        }

        const clone = template.cloneNode(true);
        clone.id = ''; 
        clone.classList.remove('hidden');
        clone.classList.add('flex', 'flex-col', 'h-full'); // Ensure full height
        clone.querySelector('#editor-title').textContent = title;
        
        container.innerHTML = ''; // Clear container (safeguard)
        container.appendChild(clone);

        const editorElement = clone.querySelector('#editor-content');
        
        if (typeof ace === 'undefined') {
            editorElement.innerHTML = '<div class="p-4 text-red-500">Ace Editor not loaded</div>';
            container.appendChild(clone);
            return null;
        }

        // Init Ace directly on element
        const aceEditor = ace.edit(editorElement);
        aceEditor.setTheme("ace/theme/dracula"); // Better match for dark mode
        aceEditor.session.setMode("ace/mode/json");
        aceEditor.setValue(initialValue, -1);
        aceEditor.setFontSize(15);
        aceEditor.setShowPrintMargin(false);
        aceEditor.session.setUseWrapMode(true);
        
        // Make background transparent to match container
        aceEditor.container.style.background = "transparent";
        aceEditor.renderer.$gutter.style.backgroundColor = "transparent"; 
        aceEditor.renderer.$gutter.style.borderRight = "none";
        
        aceEditor.setOptions({
            fixedWidthGutter: true,
            showGutter: true,
            highlightActiveLine: false, // Remove line background highlight
            highlightGutterLine: false, // Remove gutter active line highlight
            zIndex: 0
        });
        
        // Fix for Ace not resizing automatically if container changes
        new ResizeObserver(() => {
            aceEditor.resize();
        }).observe(clone);

        return {
            element: clone,
            instance: aceEditor, // The raw Ace instance
            getValue: () => aceEditor.getValue(),
            setValue: (val) => {
                aceEditor.setValue(val, -1);
            }
        };
    }
};
