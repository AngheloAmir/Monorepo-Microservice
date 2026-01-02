window.ManageCategories = {
    init: async function() {
        if (!document.getElementById('manage-categories-modal')) {
             try {
                 const res = await fetch('/gui/components/ManageCategories.html');
                 const text = await res.text();
                 const div = document.createElement('div');
                 div.innerHTML = text;
                 document.body.appendChild(div.firstElementChild);
                 document.body.appendChild(div.querySelector('#manage-cat-item-template'));
             } catch(e) {
                 console.error('Failed to load ManageCategories modal', e);
             }
        }
    },

    open: async function() {
        if (!document.getElementById('manage-categories-modal')) await this.init();
        const modal = document.getElementById('manage-categories-modal');
        if (!modal) return;
        
        modal.classList.remove('hidden');
        this.render();
    },

    close: function() {
        const modal = document.getElementById('manage-categories-modal');
        if (modal) modal.classList.add('hidden');
    },

    render: function() {
        const container = document.getElementById('manage-cat-list');
        const template = document.getElementById('manage-cat-item-template');
        if (!container || !template) return;
        
        container.innerHTML = '';
        
        // Get data from global nav or fetch fresh? 
        // Using global nav data is faster, but we should probably fetch fresh to be safe?
        // Let's rely on AccordionNav.data for now + index
        const data = window.AccordionNav && window.AccordionNav.data ? window.AccordionNav.data : [];

        data.forEach((cat, index) => {
            const clone = template.content.cloneNode(true);
            const item = clone.querySelector('.cat-item');
            
            const nameEl = item.querySelector('.cat-name');
            const inputEl = item.querySelector('.cat-edit-input');
            const renameBtn = item.querySelector('.btn-rename');
            const saveBtn = item.querySelector('.btn-save');
            const cancelBtn = item.querySelector('.btn-cancel');
            const deleteBtn = item.querySelector('.btn-delete');

            nameEl.textContent = cat.category;
            
            // Rename Logic
            renameBtn.onclick = () => {
                nameEl.classList.add('hidden');
                renameBtn.classList.add('hidden');
                deleteBtn.classList.add('hidden');
                
                inputEl.value = cat.category;
                inputEl.classList.remove('hidden');
                inputEl.focus();
                
                saveBtn.classList.remove('hidden');
                cancelBtn.classList.remove('hidden');
            };

            const cancelEdit = () => {
                nameEl.classList.remove('hidden');
                renameBtn.classList.remove('hidden');
                deleteBtn.classList.remove('hidden');
                
                inputEl.classList.add('hidden');
                saveBtn.classList.add('hidden');
                cancelBtn.classList.add('hidden');
            };
            
            cancelBtn.onclick = cancelEdit;

            saveBtn.onclick = async () => {
                const newName = inputEl.value.trim();
                if (newName && newName !== cat.category) {
                    await this.updateCategory(index, newName);
                } else {
                    cancelEdit();
                }
            };
            
            // Delete Logic
            deleteBtn.onclick = async () => {
                if (confirm("The delete method can only be reverse by GIT, continue?")) {
                    await this.deleteCategory(index);
                }
            };

            container.appendChild(item);
        });
    },

    add: async function() {
        const input = document.getElementById('new-cat-name');
        const name = input.value.trim();
        if (!name) return;

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
                input.value = '';
                await this.refresh();
            } else {
                alert('Error: ' + result.error);
            }
        } catch(e) {
            console.error(e);
            alert("Network error");
        }
    },

    updateCategory: async function(index, newName) {
        try {
            const res = await fetch('/api/crudedit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'rename_category',
                    categoryIndex: index,
                    newName: newName
                })
            });
            const result = await res.json();
            if (result.success) {
                await this.refresh();
            } else {
                alert('Error: ' + result.error);
            }
        } catch(e) {
            console.error(e);
            alert("Network error");
        }
    },

    deleteCategory: async function(index) {
        try {
            const res = await fetch('/api/crudedit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_category',
                    categoryIndex: index
                })
            });
            const result = await res.json();
            if (result.success) {
                await this.refresh();
            } else {
                alert('Error: ' + result.error);
            }
        } catch(e) {
            console.error(e);
            alert("Network error");
        }
    },

    refresh: async function() {
        if (window.loadCrudData) {
            await window.loadCrudData();
            this.render(); // Re-render self after data update
        } else {
            window.location.reload();
        }
    }
};
