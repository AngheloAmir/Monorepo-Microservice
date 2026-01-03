/**
 * Creates and opens a modal with a title, message, and an input field.
 * Returns a Promise that resolves to the input text if confirmed, or null if cancelled/closed.
 * 
 * Usage:
 * const text = await window.openInputModal('Kill Port', 'Enter port:', '3000');
 */
window.openInputModal = function(title, message, placeholder = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in p-4';
        
        const modal = document.createElement('div');
        modal.className = 'bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-95 opacity-0';
        
        setTimeout(() => {
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Content
        const header = document.createElement('h3');
        header.className = 'text-xl font-bold text-white mb-2';
        header.textContent = title;

        const msg = document.createElement('p');
        msg.className = 'text-gray-300 text-sm mb-6 leading-relaxed';
        msg.textContent = message;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mb-6';
        input.placeholder = placeholder;
        
        // Actions
        const btnContainer = document.createElement('div');
        btnContainer.className = 'flex justify-end gap-3';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium';
        cancelBtn.textContent = 'Cancel';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all text-sm font-bold';
        confirmBtn.textContent = 'Submit';

        // Assembly
        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
        modal.appendChild(header);
        modal.appendChild(msg);
        modal.appendChild(input);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        input.focus();

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
        const onConfirm = () => {
            const val = input.value.trim();
            if (val) close(val);
            else {
                input.classList.add('border-red-500');
                input.focus();
            }
        };

        cancelBtn.onclick = onCancel;
        overlay.onclick = (e) => {
            if (e.target === overlay) onCancel();
        };
        confirmBtn.onclick = onConfirm;

        input.onkeydown = (e) => {
            if (e.key === 'Enter') confirmBtn.click();
            if (e.key === 'Escape') cancelBtn.click();
        };
    });
};
