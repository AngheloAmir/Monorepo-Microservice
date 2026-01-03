/**
 * Creates and opens a strictly confirmation modal (Yes/No).
 * Returns a Promise that resolves to true if confirmed, false if cancelled/closed.
 * 
 * Usage:
 * const confirmed = await window.openConfirmModal('Warning', 'Are you sure?');
 */
window.openConfirmModal = function(title, message) {
    return new Promise((resolve) => {
        // Create Modal Elements
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in p-4';
        
        const modal = document.createElement('div');
        modal.className = 'bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-95 opacity-0 text-center';
        
        // Simple animation trigger
        setTimeout(() => {
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Content
        const iconDiv = document.createElement('div');
        iconDiv.className = 'mb-4';
        iconDiv.innerHTML = '<i class="fas fa-question-circle text-4xl text-blue-500"></i>';

        const header = document.createElement('h3');
        header.className = 'text-xl font-bold text-white mb-2';
        header.textContent = title;

        const msg = document.createElement('p');
        msg.className = 'text-gray-300 text-sm mb-6 leading-relaxed';
        msg.textContent = message;

        // Actions
        const btnContainer = document.createElement('div');
        btnContainer.className = 'flex justify-center gap-4';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-6 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium border border-gray-600';
        cancelBtn.textContent = 'No';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'px-8 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all text-sm font-bold';
        confirmBtn.textContent = 'Confirm';

        // Assembly
        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
        modal.appendChild(iconDiv);
        modal.appendChild(header);
        modal.appendChild(msg);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        confirmBtn.focus();

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

        cancelBtn.onclick = () => close(false);
        overlay.onclick = (e) => {
            if (e.target === overlay) close(false);
        };
        
        confirmBtn.onclick = () => close(true);

        // Keyboard support
        modal.onkeydown = (e) => {
             if (e.key === 'Escape') close(false);
             if (e.key === 'Enter') close(true);
        };
    });
};
