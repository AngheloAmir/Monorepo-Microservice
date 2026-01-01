window.TerminalModal = {
    overlay: null,
    content: null,
    statusDot: null,
    statusText: null,
    closeBtn: null,
    
    init: async function() {
        if (document.getElementById('modal-terminal-overlay')) return;

        try {
            const res = await fetch('/gui/components/ModalTerminal.html');
            if (res.ok) {
                const html = await res.text();
                // Inject into body
                const div = document.createElement('div');
                div.innerHTML = html;
                document.body.appendChild(div); // Append wrapper
                
                // Now unwrap so the overlay is direct child of body if simpler, or just keep as is.
                // The HTML provided is the overlay itself within a div? 
                // Wait, components usually just return the partial.
                // My HTML starts with <div id="modal-terminal-overlay"...
                // So inside `div` there is the overlay.
                const overlay = div.querySelector('#modal-terminal-overlay');
                document.body.appendChild(overlay);
                div.remove();

                this.overlay = document.getElementById('modal-terminal-overlay');
                this.content = document.getElementById('terminal-content');
                this.statusDot = document.getElementById('terminal-status-dot');
                this.statusText = document.getElementById('terminal-status-text');
                this.closeBtn = document.getElementById('terminal-close-btn');
            }
        } catch (e) {
            console.error('Failed to init terminal modal', e);
        }
    },

    open: async function() {
        if (!this.overlay) await this.init();
        this.overlay.classList.remove('hidden');
        this.content.innerHTML = '';
        this.setRunning(true);
    },

    close: function() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
    },

    write: function(text) {
        if (!this.content) return;
        const formatted = this.parseAnsi(text);
        
        // Auto scroll to bottom
        const isScrolledToBottom = this.content.scrollHeight - this.content.clientHeight <= this.content.scrollTop + 10;
        
        // Append text
        const span = document.createElement('span');
        span.innerHTML = formatted;
        this.content.appendChild(span);

        if (isScrolledToBottom) {
             this.content.scrollTop = this.content.scrollHeight;
        } else {
             this.content.scrollTop = this.content.scrollHeight; // Force scroll for now
        }
    },

    setRunning: function(isRunning) {
        if (this.statusDot && this.statusText && this.closeBtn) {
            if (isRunning) {
                this.statusDot.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
                this.statusText.textContent = "RUNNING...";
                this.closeBtn.classList.add('hidden');
            } else {
                this.statusDot.className = "w-2 h-2 rounded-full bg-gray-500";
                this.statusText.textContent = "COMPLETED";
                this.closeBtn.classList.remove('hidden');
            }
        }
    },

    // Simple ANSI parser
    parseAnsi: function(text) {
        // Remove heartbeat
        text = text.replace(/::HEARTBEAT::\n?/g, '');
        
        // Basics
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Colors
        // \x1b[31m -> <span class="term-red">
        // \x1b[39m or \x1b[0m -> </span>
        
        // Very basic implementation. For robust Ansi, use a library.
        // Handling: 0 (reset), 1 (bold), 30-37 (colors)
        
        let html = text
            .replace(/\x1b\[0?m/g, '</span>')
            .replace(/\x1b\[1m/g, '<span class="term-bold">')
            .replace(/\x1b\[30m/g, '<span class="term-black">')
            .replace(/\x1b\[31m/g, '<span class="term-red">')
            .replace(/\x1b\[32m/g, '<span class="term-green">')
            .replace(/\x1b\[33m/g, '<span class="term-yellow">')
            .replace(/\x1b\[34m/g, '<span class="term-blue">')
            .replace(/\x1b\[35m/g, '<span class="term-magenta">')
            .replace(/\x1b\[36m/g, '<span class="term-cyan">')
            .replace(/\x1b\[37m/g, '<span class="term-white">');
            
        // Clean up remaining codes (simplified)
        html = html.replace(/\x1b\[[0-9;]*[mK]/g, ''); 
        
        return html;
    }
};

// Autoinit
window.TerminalModal.init();
