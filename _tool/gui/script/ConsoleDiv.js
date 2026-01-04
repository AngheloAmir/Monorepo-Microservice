class ConsoleDiv {
    constructor(containerDescriptor) {
        // containerDescriptor can be an ID string or an HTMLElement
        this.container = typeof containerDescriptor === 'string' 
            ? document.getElementById(containerDescriptor) 
            : containerDescriptor;
        
        this.outputEl = null;
        this.isReady = false;
        this.messageQueue = [];
        
        this.init();
    }

    async init() {
        if (!this.container) {
            console.error("ConsoleDiv: Container not found");
            return;
        }

        try {
            const res = await fetch('/gui/components/ConsoleDiv.html');
            if (!res.ok) throw new Error('Failed to load ConsoleDiv template');
            
            this.container.innerHTML = await res.text();
            
            // Bind elements
            this.outputEl = this.container.querySelector('.console-output');
            const clearBtn = this.container.querySelector('.btn-clear');
            const copyBtn = this.container.querySelector('.btn-copy');
            
            if (clearBtn) {
                clearBtn.onclick = () => this.clear();
            }
            if (copyBtn) {
                copyBtn.onclick = () => this.copyContent();
            }

            this.isReady = true;
            this.flushQueue();
            
            // Remove the "Checking Console..." placeholder if it exists and we have real logs
            const placeholder = this.outputEl.querySelector('.italic');
            if(placeholder) placeholder.remove();
            
            // this.log("Console ready.", true); // Removed per user request
        } catch (e) {
            console.error("ConsoleDiv Init Error:", e);
            if(this.container) this.container.textContent = "Error loading console component.";
        }
    }

    flushQueue() {
        while(this.messageQueue.length > 0) {
            const { text, isSystem } = this.messageQueue.shift();
            this.log(text, isSystem);
        }
    }

    log(text, isSystem = false) {
        if (!this.isReady || !this.outputEl) {
            this.messageQueue.push({ text, isSystem });
            return;
        }
        
        // Smart Scroll: Check if we are at the bottom before adding content
        // buffer of 50px to account for padding/margins
        const isAtBottom = this.outputEl.scrollHeight - this.outputEl.scrollTop <= this.outputEl.clientHeight + 50;

        let html = text;
        // Parse ANSI if not system message (system messages usually plaintext)
        // or parse anyway.
        html = this.parseAnsi(text);

        const div = document.createElement('div');
        if (isSystem) {
             div.classList.add('text-blue-400', 'font-bold', 'mb-2', 'border-b', 'border-gray-800', 'pb-1');
        } else {
             div.classList.add('whitespace-pre-wrap', 'break-all');
        }
        
        div.innerHTML = html;
        this.outputEl.appendChild(div);
        
        // Only scroll to bottom if we were already there
        if (isAtBottom) {
            this.scrollToBottom();
        }
    }
    
    clear() {
        if(this.outputEl) this.outputEl.innerHTML = '';
    }

    copyContent() {
        if(!this.outputEl) return;
        const text = this.outputEl.innerText;
        navigator.clipboard.writeText(text).then(() => {
            // Optional: visual feedback
            const copyBtn = this.container.querySelector('.btn-copy');
            if(copyBtn) {
                const original = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check text-green-500"></i>';
                setTimeout(() => copyBtn.innerHTML = original, 1000);
            }
        });
    }

    scrollToBottom() {
        if(this.outputEl) {
            this.outputEl.scrollTop = this.outputEl.scrollHeight;
        }
    }

    parseAnsi(text) {
        if(!text) return '';
        // Remove heartbeat
        text = text.replace(/::HEARTBEAT::\n?/g, '');
        
        // Escape HTML
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Simple ANSI implementation
        const styles = {
            0: 'reset',
            1: 'font-weight: bold',
            // Foreground
            30: 'color: #000',
            31: 'color: #ef4444', // red-500
            32: 'color: #22c55e', // green-500
            33: 'color: #eab308', // yellow-500
            34: 'color: #3b82f6', // blue-500
            35: 'color: #d946ef', // fuchsia-500
            36: 'color: #06b6d4', // cyan-500
            37: 'color: #fff',
            // Background (simplified, can add more if needed)
            40: 'background-color: #000',
        };

        // This regex matches \x1b[...m
        const ansiRegex = /\x1b\[([0-9;]*)m/g;
        
        // State machine approach is better for nested, but simple replacement works for basic logs
        // We will use spans.
        
        let html = text;
        
        // Reset
        html = html.replace(/\x1b\[0?m/g, '</span>');
        
        // Colors
        html = html.replace(/\x1b\[([0-9;]+)m/g, (match, codes) => {
            const codeArray = codes.split(';');
            let styleStr = '';
            let classes = '';
            
            codeArray.forEach(code => {
                const c = parseInt(code);
                if (c === 0) {
                    // Reset handled by replace specific or closing tag usually
                    // But here we are opening new spans? 
                    // A proper parser tracks state. 
                    // For now, let's map common codes to classes.
                } 
                else if (c === 1) classes += ' font-bold';
                else if (c === 30) classes += ' text-gray-500'; // black might be invisible on dark term
                else if (c === 31) classes += ' text-red-500';
                else if (c === 32) classes += ' text-green-500';
                else if (c === 33) classes += ' text-yellow-500';
                else if (c === 34) classes += ' text-blue-500';
                else if (c === 35) classes += ' text-purple-500';
                else if (c === 36) classes += ' text-cyan-500';
                else if (c === 37) classes += ' text-white';
                
            });
            
            if (classes || styleStr) {
                 return `<span class="${classes}" style="${styleStr}">`;
            }
            return '';
        });

        // Cleanup any dangling or unmapped
        // html = html.replace(/\x1b\[.*?m/g, ''); 

        return html;
    }
}

// Global exposure
window.ConsoleDiv = ConsoleDiv;
