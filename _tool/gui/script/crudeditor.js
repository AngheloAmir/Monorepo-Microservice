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

    open: async function(catIndex, itemIndex) {
        if (!document.getElementById('crud-editor-modal')) await this.init();
        const modal = document.getElementById('crud-editor-modal');
        if (!modal) return;
        
        modal.classList.remove('hidden');

        // Update Title
        const titleEl = document.getElementById('crud-editor-title');
        if (titleEl) titleEl.textContent = 'Edit CRUD Item';

        let item = null;
        if (window.AccordionNav && window.AccordionNav.data) {
             const cat = window.AccordionNav.data[catIndex];
             if (cat && cat.items) {
                 item = cat.items[itemIndex];
             }
        }

        if (!item) {
            console.error('Item not found for editing');
            modal.classList.add('hidden');
            return;
        }

        // Populate Form
        document.getElementById('edit-cat-index').value = catIndex;
        document.getElementById('edit-item-index').value = itemIndex;
        
        document.getElementById('edit-label').value = item.label || '';
        document.getElementById('edit-route').value = item.route || '';
        document.getElementById('edit-method').value = item.methods || 'GET';
        document.getElementById('edit-avail').value = item.availableFor || 'public';
        document.getElementById('edit-desc').value = item.description || '';
        
        document.getElementById('edit-sample-input').value = item.sampleInput || '{}';
        document.getElementById('edit-expected-outcome').value = item.expectedOutcome || '';
        
        // Render UI Cards
        const suggested = item.suggested || [];
        this.renderSuggestions(suggested);

        const info = document.getElementById('crud-editor-debug-info');
        if(info) info.textContent = `Editing: ${item.label} [${catIndex}, ${itemIndex}]`;
        
        // Show Delete Button
        const delBtn = document.getElementById('crud-delete-btn');
        if (delBtn) delBtn.classList.remove('hidden');
    },

    create: async function(catIndex) {
        if (!document.getElementById('crud-editor-modal')) await this.init();
        const modal = document.getElementById('crud-editor-modal');
        if (!modal) return;
        
        modal.classList.remove('hidden');

        // Deselect in Nav
        if (window.AccordionNav) window.AccordionNav.deselectAll();
        if (window.CrudTest && window.CrudTest.resetSelection) window.CrudTest.resetSelection();
        
        // Update Title
        const titleEl = document.getElementById('crud-editor-title');
        if (titleEl) titleEl.textContent = 'Add New Route Test';

        document.getElementById('edit-cat-index').value = catIndex;
        document.getElementById('edit-item-index').value = "-1"; 
        
        document.getElementById('edit-label').value = 'New Route';
        document.getElementById('edit-route').value = '/new-route';
        document.getElementById('edit-method').value = 'GET';
        document.getElementById('edit-avail').value = 'public';
        document.getElementById('edit-desc').value = '';
        
        document.getElementById('edit-sample-input').value = '{}';
        document.getElementById('edit-expected-outcome').value = '';
        
        // Render Empty
        this.renderSuggestions([]);
        
        // Hide Delete Button
        const delBtn = document.getElementById('crud-delete-btn');
        if (delBtn) delBtn.classList.add('hidden');
        
        const info = document.getElementById('crud-editor-debug-info');
        if(info) info.textContent = `Creating New Route in Category [${catIndex}]`;
    },

    renderSuggestions: function(suggested) {
        const container = document.getElementById('suggested-items-container');
        if (!container) return;
        container.innerHTML = '';
        
        if (!suggested || suggested.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-600 italic text-sm py-4" id="suggested-empty-msg">No suggestions added.</div>';
            return;
        }

        suggested.forEach(s => {
            container.appendChild(this.createSuggestionCard(s));
        });
    },

    addSuggestionUI: function() {
        const container = document.getElementById('suggested-items-container');
        const emptyMsg = document.getElementById('suggested-empty-msg');
        if (emptyMsg) emptyMsg.remove();
        
        const newCard = this.createSuggestionCard({ name: 'New Suggestion', urlparams: '', content: '{}' });
        container.appendChild(newCard);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    createSuggestionCard: function(data) {
        const card = document.createElement('div');
        card.className = 'suggestion-card bg-gray-800 border border-gray-700 rounded p-2 flex flex-col gap-2 relative group';
        
        card.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="text" class="sug-name bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white flex-1 focus:border-blue-500 outline-none" placeholder="Name" value="${data.name || ''}">
                <input type="text" class="sug-params bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-blue-300 font-mono flex-1 focus:border-blue-500 outline-none" placeholder="?url=params" value="${data.urlparams || ''}">
                <button type="button" class="text-red-500 hover:text-red-400 p-1 opacity-50 group-hover:opacity-100 transition-opacity" title="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <textarea class="sug-content bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm font-mono text-green-300 h-32 w-full resize-y focus:border-blue-500 outline-none leading-none" placeholder="{ JSON Content }">${data.content || '{}'}</textarea>
        `;

        // Delete Handler
        const deleteBtn = card.querySelector('button');
        deleteBtn.onclick = () => {
             card.remove();
             // Check if empty
             const container = document.getElementById('suggested-items-container');
             if (container && container.children.length === 0) {
                  container.innerHTML = '<div class="text-center text-gray-600 italic text-sm py-4" id="suggested-empty-msg">No suggestions added.</div>';
             }
        };

        return card;
    },

    delete: async function() {
        if (!confirm("Delete method can only be reverse by GIT, continue?")) return;

        //clear selections
        if (window.AccordionNav) window.AccordionNav.deselectAll();
        if (window.CrudTest && window.CrudTest.resetSelection) window.CrudTest.resetSelection();

        const catIndex = parseInt(document.getElementById('edit-cat-index').value);
        const itemIndex = parseInt(document.getElementById('edit-item-index').value);

        try {
            const res = await fetch('/api/crudedit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    categoryIndex: catIndex,
                    itemIndex: itemIndex
                })
            });
            
            const result = await res.json();
            if (result.success) {
                this.close();
                if (window.loadCrudData) {
                    window.loadCrudData();
                } else {
                    window.location.reload();
                }
            } else {
                alert('Error deleting: ' + result.error);
            }
        } catch(e) {
            console.error(e);
            alert('Network Error deleting data');
        }
    },

    save: async function() {
        // Deselect in Nav
        if (window.AccordionNav) window.AccordionNav.deselectAll();
        if (window.CrudTest && window.CrudTest.resetSelection) window.CrudTest.resetSelection();

        // Collect Data
        const catIndex = parseInt(document.getElementById('edit-cat-index').value);
        const itemIndex = parseInt(document.getElementById('edit-item-index').value);
        
        const label = document.getElementById('edit-label').value;
        const route = document.getElementById('edit-route').value;
        const method = document.getElementById('edit-method').value;
        const avail = document.getElementById('edit-avail').value;
        const desc = document.getElementById('edit-desc').value;
        
        const sample = document.getElementById('edit-sample-input').value;
        const expected = document.getElementById('edit-expected-outcome').value;
        
        // Collect Suggestions from UI Cards
        let suggested = [];
        const cards = document.querySelectorAll('.suggestion-card');
        cards.forEach(card => {
            const name = card.querySelector('.sug-name').value;
            const urlparams = card.querySelector('.sug-params').value;
            const content = card.querySelector('.sug-content').value;
            
            // Basic valid for content?
            // If content is empty usually {}
            suggested.push({
                name: name,
                urlparams: urlparams,
                content: content
            });
        });

        const itemData = {
            label: label,
            route: route,
            methods: method,
            description: desc,
            sampleInput: sample,
            suggested: suggested,
            expectedOutcome: expected,
            availableFor: avail
        };

        const isNew = itemIndex === -1;
        const action = isNew ? 'add' : 'update';

        // Send to Backend
        try {
            const res = await fetch('/api/crudedit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    categoryIndex: catIndex,
                    itemIndex: itemIndex,
                    itemData: itemData
                })
            });
            
            const result = await res.json();
            if (result.success) {
                this.close();
                if (window.loadCrudData) {
                    window.loadCrudData();
                } else {
                    window.location.reload();
                }
            } else {
                alert('Error saving: ' + result.error);
            }
        } catch(e) {
            console.error(e);
            alert('Network Error saving data');
        }
    },

    close: function() {
        const modal = document.getElementById('crud-editor-modal');
        if (modal) modal.classList.add('hidden');
    }
};
