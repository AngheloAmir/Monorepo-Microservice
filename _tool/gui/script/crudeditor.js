window.CrudEditor = {
    init: async function() {
        if (!document.getElementById('crud-editor-modal')) {
             try {
                 const res = await fetch('/gui/components/crudeditor.html');
                 const text = await res.text();
                 const div = document.createElement('div');
                 div.innerHTML = text;
                 document.body.appendChild(div.firstElementChild);
             } catch(e) {
                 console.error('Failed to load CrudEditor modal', e);
             }
        }
    },

    open: function(catIndex, itemIndex) {
        const modal = document.getElementById('crud-editor-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            const info = document.getElementById('crud-editor-debug-info');
            if(info) {
                info.textContent = `Selected indices: [${catIndex}, ${itemIndex}]`;
            }
        } else {
            console.error('CrudEditor modal not found');
            this.init().then(() => this.open(catIndex, itemIndex));
        }
    },

    close: function() {
        const modal = document.getElementById('crud-editor-modal');
        if (modal) modal.classList.add('hidden');
    }
};
