/**
 * Creates and opens an alert modal with a title, message, and type.
 * Returns a Promise that resolves when the user clicks OK.
 * 
 * Usage:
 * await window.openAlertModal('Success', 'Operation completed.', 'info');
 */
window.openAlertModal = function(title, message, type = 'info') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in p-4';
        
        const modal = document.createElement('div');
        modal.className = 'bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-95 opacity-0 text-center';
        
        // Type Styling
        let iconClass = 'fa-info-circle text-blue-500';
        let btnClass = 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20';

        if (type === 'warning') {
            iconClass = 'fa-exclamation-triangle text-yellow-500';
            btnClass = 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20';
        } else if (type === 'error') {
            iconClass = 'fa-times-circle text-red-500';
            btnClass = 'bg-red-600 hover:bg-red-500 shadow-red-500/20';
        } else if (type === 'success') {
            iconClass = 'fa-check-circle text-green-500';
            btnClass = 'bg-green-600 hover:bg-green-500 shadow-green-500/20';
        }

        // Animation
        setTimeout(() => {
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Content
        const iconDiv = document.createElement('div');
        iconDiv.className = 'mb-4';
        iconDiv.innerHTML = `<i class="fas ${iconClass} text-4xl"></i>`;

        const header = document.createElement('h3');
        header.className = 'text-xl font-bold text-white mb-2';
        header.textContent = title;

        const msg = document.createElement('p');
        msg.className = 'text-gray-300 text-sm mb-6 leading-relaxed';
        msg.textContent = message;

        // Action
        const btn = document.createElement('button');
        btn.className = `w-full px-6 py-2.5 rounded-xl text-white shadow-lg transition-all font-bold ${btnClass}`;
        btn.textContent = 'OK';

        // Assembly
        modal.appendChild(iconDiv);
        modal.appendChild(header);
        modal.appendChild(msg);
        modal.appendChild(btn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        btn.focus();

        // Handlers
        const close = () => {
            modal.classList.remove('scale-100', 'opacity-100');
            modal.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                resolve();
            }, 200);
        };

        btn.onclick = close;
        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };

        btn.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') close();
        };
    });
};
