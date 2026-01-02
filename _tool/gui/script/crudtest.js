window.CrudTest = {
    currentItem: null,
    headerEditor: null,
    bodyEditor: null,
    outputViewer: null,
    suggestViewer: null,
    startTime: 0,

    init: async function() {
        // Check for a critical element to ensure page is loaded
        if (!document.getElementById('input-header-container')) return;

        // Initialize Components
        // 1. Header Editor (Left Col Top)
        this.headerEditor = await window.CrudInputEditor.create('input-header-container', 'Header JSON', '{\n  "Content-Type": "application/json"\n}');
        
        // 2. Body Editor (Left Col Bottom)
        this.bodyEditor = await window.CrudInputEditor.create('input-body-container', 'Body JSON', '{}');

        // 3. Output Viewer
        this.outputViewer = await window.CrudOutput.create('output-container');

        // 4. Suggest Viewer
        this.suggestViewer = await window.CrudSuggest.create('suggest-container-wrapper');

        // Initialize Root URL
        const rootInput = document.getElementById('crud-root-url');
        if (rootInput) {
            rootInput.value = localStorage.getItem('crud-root-url') || 'http://localhost:3000';
            rootInput.addEventListener('input', () => {
                localStorage.setItem('crud-root-url', rootInput.value);
                this.updateUrlDisplay(); // Update display if typing
            });
        }
    },

    selectItem: async function(item) {
        if (!this.headerEditor || !this.bodyEditor) {
             await this.init();
        }
        if (!this.headerEditor || !this.bodyEditor) {
             console.error("Failed to initialize editors");
             return;
        }

        this.currentItem = item;
        
        // Update Info Header
        const methodEl = document.getElementById('crud-info-method');
        const labelEl = document.getElementById('crud-info-label');
        const routeEl = document.getElementById('crud-info-route');
        const descEl = document.getElementById('crud-info-desc');
        const availEl = document.getElementById('crud-info-avail');
        const method = item.methods || 'GET';

        methodEl.textContent = method;
        methodEl.className = `font-bold ${this.getMethodColor(method)}`;
        labelEl.textContent = item.label;
        descEl.textContent = item.description || 'No description';
        
        if (item.availableFor) {
            availEl.textContent = item.availableFor;
            availEl.className = `px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${item.availableFor === 'public' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`;
        } else {
            availEl.style.display = 'none';
        }

        this.updateUrlDisplay();

        // Update Inputs
        // Reset Header? Or keep? usually keep header is better for workflow? 
        // Let's keep header for now.
        
        // Body: use sampleInput or '{}'
        const bodyVal = item.sampleInput || '{}';
        // Pretty print if string
        try {
             const obj = JSON.parse(bodyVal);
             this.bodyEditor.setValue(JSON.stringify(obj, null, 2));
        } catch(e) {
             this.bodyEditor.setValue(bodyVal);
        }

        // Suggested Output
        const suggestVal = item.expectedOutcome || '';
        this.suggestViewer.setValue(suggestVal);

        // Update Suggested Inputs Dropdown
        const suggestDropdown = document.getElementById('crud-suggest-dropdown');
        suggestDropdown.innerHTML = '<option value="">Suggested Inputs</option>';
        if (item.suggested && item.suggested.length > 0) {
            item.suggested.forEach((s, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = s.name;
                suggestDropdown.appendChild(opt);
            });
            suggestDropdown.disabled = false;
        } else {
            suggestDropdown.disabled = true;
        }
        
        // Remove empty state if present
        document.getElementById('crud-empty-state').classList.add('hidden');
        document.getElementById('crud-active-state').classList.remove('hidden');
    },

    applySuggestion: function(idx) {
        if (idx === "" || !this.currentItem || !this.currentItem.suggested) return;
        const suggestion = this.currentItem.suggested[parseInt(idx)];
        if (suggestion) {
            try {
                 // Try to prettify
                 const obj = JSON.parse(suggestion.content);
                 this.bodyEditor.setValue(JSON.stringify(obj, null, 2));
            } catch(e) {
                 this.bodyEditor.setValue(suggestion.content);
            }
        }
    },

    updateUrlDisplay: function() {
        if (!this.currentItem) return;
        const root = document.getElementById('crud-root-url').value;
        const routeEl = document.getElementById('crud-info-route');
        routeEl.textContent = `${root}${this.currentItem.route}`;
    },

    sendRequest: async function() {
        if (!this.currentItem) return;

        const root = document.getElementById('crud-root-url').value;
        const url = `${root}${this.currentItem.route}`;
        const method = this.currentItem.methods || 'GET';
        
        const headerText = this.headerEditor.getValue();
        const bodyText = this.bodyEditor.getValue();

        let headers = {};
        try { headers = JSON.parse(headerText); } catch(e) { alert('Invalid Header JSON'); return; }

        let body = null;
        if (method !== 'GET' && method !== 'HEAD') {
             try { body = bodyText; JSON.parse(bodyText); } catch(e) { alert('Invalid Body JSON'); return; }
        }

        const timeEl = document.getElementById('crud-timer');
        timeEl.textContent = 'Wait...';
        
        this.startTime = performance.now();

        try {
            const options = {
                method: method,
                headers: headers
            };
            if (body) options.body = body;

            const res = await fetch(url, options);
            const endTime = performance.now();
            const duration = (endTime - this.startTime).toFixed(2);
            timeEl.textContent = `${duration} ms`;

            const status = res.status;
            const statusText = res.statusText;
            
            // Try to parse JSON
            const text = await res.text();
            let finalOutput = `Status: ${status} ${statusText}\n\n`;
            try {
                const json = JSON.parse(text);
                finalOutput += JSON.stringify(json, null, 4);
                this.outputViewer.setValue(JSON.stringify(json, null, 4)); // Only JSON for highlighting
            } catch(e) {
                finalOutput += text;
                this.outputViewer.setValue(text);
            }

        } catch (e) {
            const endTime = performance.now();
            timeEl.textContent = `${(endTime - this.startTime).toFixed(2)} ms`;
            this.outputViewer.setValue(`Error: ${e.message}`);
        }
    },

    getMethodColor: function(method) {
        if (!method) return 'text-gray-500';
        switch(method.toUpperCase()) {
            case 'GET': return 'text-green-500';
            case 'POST': return 'text-blue-500';
            case 'PUT': return 'text-violet-500';
            case 'DELETE': return 'text-red-500';
            case 'PATCH': return 'text-purple-500';
            default: return 'text-gray-500';
        }
    }
};

window.crudTesterLoader = async function() {
    console.log('Loading CRUD Tester...');
    
    // Check if dependencies are ready
    if (!window.AccordionNav || !window.CrudEditor || !window.CrudInputEditor) {
        console.warn('Dependencies not fully loaded yet.');
    }

    try {
        const res = await fetch('/api/crud');
        if (!res.ok) throw new Error('Failed to fetch CRUD data');
        const data = await res.json();
        
        // Init Navigation
        await window.CrudEditor.init();
        await window.AccordionNav.init('crud-nav-container', data);
        
        // Init Main Content Logic
        await window.CrudTest.init();

    } catch (e) {
        console.error('Error loading CRUD tester:', e);
        const container = document.getElementById('crud-nav-container');
        if(container) {
            container.innerHTML = `
                <div class="text-red-500 p-4 text-xs flex flex-col items-center justify-center h-40 text-center gap-2">
                    <i class="fas fa-exclamation-circle text-2xl"></i>
                    <span>Error loading data.<br>${e.message}</span>
                </div>`;
        }
    }
};

