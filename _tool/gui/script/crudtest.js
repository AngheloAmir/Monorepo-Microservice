window.CrudTest = {
    headerEditor: null,
    bodyEditor: null,
    outputViewer: null,
    suggestViewer: null,
    startTime: 0,

    init: async function() {
        // Check for a critical element to ensure page is loaded
        if (!document.getElementById('input-header-container')) return;

        // Initialize Components with Persistent State
        
        // 1. Header Editor
        this.headerEditor = await window.CrudInputEditor.create(
            'input-header-container', 
            'Header JSON', 
            window.crudState.headerValue
        );
        // Bind state update
        this.headerEditor.editor.addEventListener('input', () => {
            window.crudState.headerValue = this.headerEditor.getValue();
        });
        
        // 2. Body Editor
        this.bodyEditor = await window.CrudInputEditor.create(
            'input-body-container', 
            'Body JSON', 
            window.crudState.bodyValue
        );
        // Bind state update
        this.bodyEditor.editor.addEventListener('input', () => {
            window.crudState.bodyValue = this.bodyEditor.getValue();
        });

        // 3. Output Viewer
        this.outputViewer = await window.CrudOutput.create('output-container');
        if (window.crudState.outputValue) {
            this.outputViewer.setValue(window.crudState.outputValue);
        }

        // 4. Suggest Viewer
        this.suggestViewer = await window.CrudSuggest.create('suggest-container-wrapper');
        if (window.crudState.suggestValue) {
            this.suggestViewer.setValue(window.crudState.suggestValue);
        }

        // Initialize Root URL
        const rootInput = document.getElementById('crud-root-url');
        if (rootInput) {
            rootInput.value = window.crudState.rootUrl || localStorage.getItem('crud-root-url') || 'http://localhost:3000';
            rootInput.addEventListener('input', () => {
                const val = rootInput.value;
                localStorage.setItem('crud-root-url', val);
                window.crudState.rootUrl = val;
                this.updateUrlDisplay();
            });
        }

        // Restore Selection if exists
        if (window.crudState.currentItem) {
            this.restoreSelection(window.crudState.currentItem);
        }
    },

    restoreSelection: async function(item) {
        // Updates UI for the selected item WITHOUT resetting inputs/outputs
        // Mirrors selectItem but assumes inputs are already set from state
        
        // Update Info Header
        const methodEl = document.getElementById('crud-info-method');
        const labelEl = document.getElementById('crud-info-label');
        const descEl = document.getElementById('crud-info-desc');
        const availEl = document.getElementById('crud-info-avail');
        const method = item.methods || 'GET';

        if (methodEl) {
            methodEl.textContent = method;
            methodEl.className = `font-bold ${this.getMethodColor(method)}`;
            labelEl.textContent = item.label;
            descEl.textContent = item.description || 'No description';
            
            if (item.availableFor) {
                availEl.textContent = item.availableFor;
                availEl.className = `px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${item.availableFor === 'public' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`;
                availEl.style.display = 'inline-block';
            } else {
                availEl.style.display = 'none';
            }
        }

        this.updateUrlDisplay();

        // Update Suggested Inputs Dropdown
        const suggestDropdown = document.getElementById('crud-suggest-dropdown');
        if (suggestDropdown) {
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
        }
        
        // Remove empty state
        const emptyState = document.getElementById('crud-empty-state');
        const activeState = document.getElementById('crud-active-state');
        if (emptyState && activeState) {
            emptyState.classList.add('hidden');
            activeState.classList.remove('hidden');
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

        // Save new item to state
        window.crudState.currentItem = item;
        
        // Update UI (Shared logic)
        this.restoreSelection(item);

        // Update Inputs (Reset or Load defaults for NEW selection)
        // Reset Header? usually keep header logic.
        
        // Body: use sampleInput or '{}'
        const bodyVal = item.sampleInput || '{}';
        try {
             const obj = JSON.parse(bodyVal);
             const pretty = JSON.stringify(obj, null, 2);
             this.bodyEditor.setValue(pretty);
             window.crudState.bodyValue = pretty;
        } catch(e) {
             this.bodyEditor.setValue(bodyVal);
             window.crudState.bodyValue = bodyVal;
        }

        // Suggested Output
        const suggestVal = item.expectedOutcome || '';
        this.suggestViewer.setValue(suggestVal);
        window.crudState.suggestValue = suggestVal;
    },

    applySuggestion: function(idx) {
        if (idx === "" || !window.crudState.currentItem || !window.crudState.currentItem.suggested) return;
        const suggestion = window.crudState.currentItem.suggested[parseInt(idx)];
        if (suggestion) {
            try {
                 const obj = JSON.parse(suggestion.content);
                 const pretty = JSON.stringify(obj, null, 2);
                 this.bodyEditor.setValue(pretty);
                 window.crudState.bodyValue = pretty;
            } catch(e) {
                 this.bodyEditor.setValue(suggestion.content);
                 window.crudState.bodyValue = suggestion.content;
            }
        }
    },

    updateUrlDisplay: function() {
        if (!window.crudState.currentItem) return;
        const root = document.getElementById('crud-root-url').value;
        const routeEl = document.getElementById('crud-info-route');
        if(routeEl) routeEl.textContent = `${root}${window.crudState.currentItem.route}`;
    },

    sendRequest: async function() {
        const item = window.crudState.currentItem;
        if (!item) return;

        const root = document.getElementById('crud-root-url').value;
        const url = `${root}${item.route}`;
        const method = item.methods || 'GET';
        
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
                headers: headers,
                mode: 'cors'
            };
            if (body) options.body = body;

            const res = await fetch(url, options);
            const endTime = performance.now();
            const duration = (endTime - this.startTime).toFixed(2);
            timeEl.textContent = `${duration} ms`;

            const status = res.status;
            const statusText = res.statusText;
            
            const text = await res.text();
            let finalOutput = `Status: ${status} ${statusText}\n\n`;
            let valToSet = '';
            try {
                const json = JSON.parse(text);
                const pretty = JSON.stringify(json, null, 4);
                valToSet = finalOutput + pretty;
                this.outputViewer.setValue(pretty); 
            } catch(e) {
                valToSet = finalOutput + text;
                this.outputViewer.setValue(text);
            }
            window.crudState.outputValue = valToSet; // Store result

        } catch (e) {
            const endTime = performance.now();
            timeEl.textContent = `${(endTime - this.startTime).toFixed(2)} ms`;
            const errMsg = `Error: ${e.message}`;
            this.outputViewer.setValue(errMsg);
            window.crudState.outputValue = errMsg;
        }
    },

    getMethodColor: function(method) {
        if (!method) return 'text-gray-500';
        switch(method.toUpperCase()) {
            case 'GET':    return 'text-green-500';
            case 'POST':   return 'text-blue-500';
            case 'PUT':    return 'text-violet-500';
            case 'DELETE': return 'text-red-500';
            case 'PATCH':  return 'text-purple-500';
            case 'STREAM': return 'text-orange-500';
            default:       return 'text-gray-500';
        }
    }
};

window.crudTesterLoader = async function() {
    console.log('Loading CRUD Tester...');
    
    // Check Dependencies
    if (!window.AccordionNav || !window.CrudEditor || !window.CrudInputEditor) {
        console.warn('Dependencies not fully loaded yet.');
    }

    // Cache Templates Logic
    if (!window.crudTemplates.inputEditor || 
        !window.crudTemplates.output || 
        !window.crudTemplates.suggest ||
        !window.crudTemplates.accordion) {
            
            console.log("Fetching CRUD templates...");
            const [inputTpl, outputTpl, suggestTpl, accordionTpl] = await Promise.all([
                fetch('/gui/components/CrudInputEditor.html').then(r => r.text()),
                fetch('/gui/components/CrudOutput.html').then(r => r.text()),
                fetch('/gui/components/CrudSuggest.html').then(r => r.text()),
                fetch('/gui/components/accordionnav.html').then(r => r.text())
            ]);
            
            window.crudTemplates.inputEditor = inputTpl;
            window.crudTemplates.output = outputTpl;
            window.crudTemplates.suggest = suggestTpl;
            window.crudTemplates.accordion = accordionTpl;
            
            // Inject templates into DOM if not exists, so components can find them by ID
            const inject = (html, id) => {
                const div = document.createElement('div');
                div.innerHTML = html;
                const template = div.firstElementChild;
                if (template && !document.getElementById(template.id)) {
                    template.classList.add('hidden');
                    document.body.appendChild(template);
                }
            };

            inject(inputTpl); // CrudInputEditor.html has id crud-input-editor-template
            inject(outputTpl); // CrudOutput.html has id crud-output-template
            inject(suggestTpl); // CrudSuggest.html has id crud-suggest-template
            inject(accordionTpl); // accordionnav.html has id accordion-nav-template
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

