/**
 * Creates and opens a modal specifically for Turbo Rep Pruning.
 * Fetches the list of pruneable workspaces from the server.
 * Returns a Promise that resolves to the selected package name.
 */
window.openTurboPruneModal = function() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in p-4';
        
        const modal = document.createElement('div');
        modal.className = 'bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all scale-95 opacity-0 flex flex-col max-h-[90vh]';
        
        setTimeout(() => {
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Header
        const header = document.createElement('h3');
        header.className = 'text-xl font-bold text-white mb-2 flex-none';
        header.textContent = "Prune Docker Scope";

        const msg = document.createElement('p');
        msg.className = 'text-gray-300 text-sm mb-6 leading-relaxed flex-none';
        msg.textContent = "Select a workspace to create a pruned Docker build slice.";

        // Loader
        const loader = document.createElement('div');
        loader.className = 'text-center py-8 text-gray-400 italic';
        loader.textContent = "Scanning workspaces...";

        const listContainer = document.createElement('div');
        listContainer.className = 'flex-1 overflow-y-auto flex flex-col gap-3 mb-6 pr-2 hidden'; 

        // Actions
        const btnContainer = document.createElement('div');
        btnContainer.className = 'flex justify-end gap-3 flex-none border-t border-gray-700/50 pt-4';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium';
        cancelBtn.textContent = 'Cancel';

        // Assembly
        btnContainer.appendChild(cancelBtn);
        modal.appendChild(header);
        modal.appendChild(msg);
        modal.appendChild(loader);
        modal.appendChild(listContainer);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Handlers
        const close = (value) => {
            modal.classList.remove('scale-100', 'opacity-100');
            modal.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                resolve(value);
            }, 200);
        };

        const onCancel = () => close(null);
        cancelBtn.onclick = onCancel;
        overlay.onclick = (e) => {
            if (e.target === overlay) onCancel();
        };

        // Fetch Data
        fetch('/api/turborepo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list-prunable' })
        })
        .then(res => res.json())
        .then(data => {
            loader.classList.add('hidden');
            listContainer.classList.remove('hidden');

            if (data.workspaces && data.workspaces.length > 0) {
                // Determine icons based on name context
                data.workspaces.forEach(ws => {
                    const itemEl = document.createElement('button');
                    itemEl.className = 'w-full text-left bg-gray-900/50 border border-gray-700 rounded-xl p-4 hover:bg-gray-700/50 hover:border-cyan-500/50 transition-all group flex items-center gap-4 focus:outline-none focus:ring-2 focus:ring-cyan-500';
                    
                    // Icon
                    const iconDiv = document.createElement('div');
                    iconDiv.className = 'w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/10 transition-colors';
                    const icon = document.createElement('i');
                    // Ensure icon class is safe
                    icon.className = `${ws.icon || 'fas fa-box'} text-gray-400 group-hover:text-cyan-400 text-lg transition-colors`;
                    iconDiv.appendChild(icon);

                    // Text
                    const textDiv = document.createElement('div');
                    textDiv.className = 'flex flex-col';
                    
                    const nameEl = document.createElement('span');
                    nameEl.className = 'font-bold text-gray-200 group-hover:text-white mb-0.5 text-base';
                    nameEl.textContent = ws.name; 
                    
                    const descEl = document.createElement('span');
                    descEl.className = 'text-xs text-gray-500 group-hover:text-gray-400';
                    descEl.textContent = ws.description || '';

                    textDiv.appendChild(nameEl);
                    if(ws.description) textDiv.appendChild(descEl);
                    
                    itemEl.appendChild(iconDiv);
                    itemEl.appendChild(textDiv);

                    itemEl.onclick = () => close(ws.name);
                    listContainer.appendChild(itemEl);
                });
            } else {
                listContainer.innerHTML = "<div class='text-gray-500 text-center p-4'>No workspaces found.</div>";
            }
        })
        .catch(err => {
            loader.textContent = "Error loading workspaces.";
            console.error(err);
        });

        // Key binding
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                onCancel();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    });
};
