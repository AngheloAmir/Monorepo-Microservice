/**
 * Creates and opens a modal that creates HTML content.
 * Returns a Promise that resolves when the user closes it.
 * 
 * Usage:
 * await window.openHtmlModal('My Title', '<p>Some <b>HTML</b> content</p>');
 */
window.openHtmlModal = function(title, htmlContent, btnText = 'Close') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in p-4';
        
        const modal = document.createElement('div');
        // Larger max-width for content usually
        modal.className = 'bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col transform transition-all scale-95 opacity-0';
        
        // Animation
        setTimeout(() => {
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-center p-6 border-b border-gray-700';
        
        const headerTitle = document.createElement('h3');
        headerTitle.className = 'text-xl font-bold text-white';
        headerTitle.textContent = title;

        const closeBtnIcon = document.createElement('button');
        closeBtnIcon.className = 'text-gray-400 hover:text-white transition-colors';
        closeBtnIcon.innerHTML = '<i class="fas fa-times text-xl"></i>';
        
        headerDiv.appendChild(headerTitle);
        headerDiv.appendChild(closeBtnIcon);

        // Content Scrollable Area
        const contentDiv = document.createElement('div');
        contentDiv.className = 'p-6 overflow-y-auto text-gray-300 space-y-4 leading-relaxed';
        contentDiv.innerHTML = htmlContent;

        // Footer Action
        const footerDiv = document.createElement('div');
        footerDiv.className = 'p-6 border-t border-gray-700 flex justify-end';

        const btn = document.createElement('button');
        btn.className = 'px-6 py-2.5 rounded-xl text-white shadow-lg transition-all font-bold bg-blue-600 hover:bg-blue-500 shadow-blue-500/20';
        btn.textContent = btnText;

        footerDiv.appendChild(btn);

        // Assembly
        modal.appendChild(headerDiv);
        modal.appendChild(contentDiv);
        modal.appendChild(footerDiv);
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
        closeBtnIcon.onclick = close;
        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };

        btn.onkeydown = (e) => {
            if (e.key === 'Escape') close();
        };
    });
};
