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
        
        // Get data from global nav
        const data = window.AccordionNav && window.AccordionNav.data ? window.AccordionNav.data : [];

        data.forEach((cat, index) => {
            const clone = template.content.cloneNode(true);
            const item = clone.querySelector('.cat-item');
            
            // Elements
            const viewMode = item.querySelector('.view-mode');
            const editMode = item.querySelector('.edit-mode');
            
            // View Elements
            const nameEl = item.querySelector('.cat-name');
            const devEl  = item.querySelector('.cat-dev-text');
            const prodEl = item.querySelector('.cat-prod-text');
            
            // Edit Elements
            const editName = item.querySelector('.edit-name');
            const editDev  = item.querySelector('.edit-dev');
            const editProd = item.querySelector('.edit-prod');
            
            // Buttons
            const editBtn   = item.querySelector('.btn-edit');
            const deleteBtn = item.querySelector('.btn-delete');
            const saveBtn   = item.querySelector('.btn-save');
            const cancelBtn = item.querySelector('.btn-cancel');

            // Initialize View
            nameEl.textContent = cat.category;
            devEl.textContent  = cat.devurl || 'http://localhost:3200';
            prodEl.textContent = cat.produrl || 'http://localhost:3200';
            
            // Edit Logic
            editBtn.onclick = () => {
                viewMode.classList.add('hidden');
                editMode.classList.remove('hidden');
                editMode.classList.add('flex');
                
                editName.value = cat.category;
                editDev.value  = cat.devurl || 'http://localhost:3200';
                editProd.value = cat.produrl || 'http://localhost:3200';
            };

            const cancelEdit = () => {
                viewMode.classList.remove('hidden');
                editMode.classList.add('hidden');
                editMode.classList.remove('flex');
            };
            
            cancelBtn.onclick = cancelEdit;

            saveBtn.onclick = async () => {
                const newName = editName.value.trim();
                const newDev  = editDev.value.trim();
                const newProd = editProd.value.trim();
                
                if (newName) {
                    await this.updateCategory(index, {
                        category: newName,
                        devurl: newDev,
                        produrl: newProd
                    });
                } else {
                    cancelEdit();
                }
            };
            
            // Delete Logic
            deleteBtn.onclick = async () => {
                const confirmed = await window.openConfirmModal(
                    "Warning", 
                    "The delete method can only be reverse by GIT, continue?"
                );
                
                if (confirmed) {
                    await this.deleteCategory(index);
                }
            };

            container.appendChild(item);
        });
    },

    add: async function() {
        const nameInput = document.getElementById('new-cat-name');
        const devInput  = document.getElementById('new-cat-dev');
        const prodInput = document.getElementById('new-cat-prod');
        
        const name = nameInput.value.trim();
        const dev  = devInput.value.trim();
        const prod = prodInput.value.trim();

        if (!name) return;

        try {
            const res = await fetch('/api/crudedit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_category',
                    itemData: { 
                        category: name,
                        devurl: dev || 'http://localhost:3200',
                        produrl: prod || 'http://localhost:3200'
                    }
                })
            });
            const result = await res.json();
            if (result.success) {
                nameInput.value = '';
                devInput.value = '';
                prodInput.value = '';
                await this.refresh();
            } else {
                await window.openAlertModal('Error', result.error, 'error');
            }
        } catch(e) {
            console.error(e);
            await window.openAlertModal('Error', 'Network error', 'error');
        }
    },

    updateCategory: async function(index, itemData) {
        try {
            const res = await fetch('/api/crudedit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_category',
                    categoryIndex: index,
                    itemData: itemData
                })
            });
            const result = await res.json();
            if (result.success) {
                await this.refresh();
            } else {
                await window.openAlertModal('Error', result.error, 'error');
            }
        } catch(e) {
            console.error(e);
            await window.openAlertModal('Error', 'Network error', 'error');
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
                await window.openAlertModal('Error', result.error, 'error');
            }
        } catch(e) {
            console.error(e);
            await window.openAlertModal('Error', 'Network error', 'error');
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
