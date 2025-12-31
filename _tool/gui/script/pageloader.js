window.PageLoader = {
    cache: {}, // Keep the cache object structure if other things need it, but we won't use it for checking
    load: async function(pageId) {
        const contentContainer = document.getElementById('app-content');
        if (!contentContainer) return;

        // Show loading state
        contentContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        `;

        try {
            // Bypass cache to always fetch fresh content for reloading data scripts
            // if (this.cache[pageId]) { ... }

            // Fetch the page
            const response = await fetch(`/gui/page/${pageId}.html`);
            
            if (!response.ok) {
                // If not found, show work in progress or error
                 contentContainer.innerHTML = this.getWorkInProgressHtml(pageId);
                return;
            }

            const html = await response.text();
            this.cache[pageId] = html;
            contentContainer.innerHTML = html;
            this.executeScripts(contentContainer);

        } catch (error) {
            console.error('Error loading page:', error);
             contentContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-red-400">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>Error loading content.</p>
                </div>
            `;
        }
    },

    executeScripts: function(container) {
        // Execute any scripts found in the loaded HTML
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            Array.from(script.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = script.textContent;
            script.parentNode.replaceChild(newScript, script);
        });
    },

    getWorkInProgressHtml: function(pageId) {
        // Provide a nice fallback for missing pages
         return `
            <div class="flex flex-col items-center justify-center h-full text-gray-500 animate-fade-in pb-20">
                <div class="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <i class="fas fa-hammer text-4xl text-gray-600"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-300 mb-2">Work in Progress</h2>
                <p class="text-gray-500 text-center max-w-sm">
                    The <span class="text-blue-400 font-mono">${pageId}</span> module is currently under construction.
                </p>
            </div>
         `;
    }
};
