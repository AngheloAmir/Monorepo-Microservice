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
        // Bind state update (Ace Editor change event)
        this.headerEditor.instance.session.on('change', () => {
            window.crudState.headerValue = this.headerEditor.getValue();
        });
        
        // 2. Body Editor
        this.bodyEditor = await window.CrudInputEditor.create(
            'input-body-container', 
            'Body JSON', 
            window.crudState.bodyValue
        );
        // Bind state update
        this.bodyEditor.instance.session.on('change', () => {
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
        
        // Initialize Params Input
        const paramInput = document.getElementById('crud-param-input');
        if (paramInput) {
            paramInput.value = window.crudState.paramValue || '';
            paramInput.addEventListener('input', () => {
                window.crudState.paramValue = paramInput.value;
                this.updateUrlDisplay();
            });
        }

        // Initialize Global Click to lose menus
        document.addEventListener('click', (e) => {
            const container = document.getElementById('crud-presets-container');
            const menu = document.getElementById('crud-presets-menu');
            if (container && menu && !container.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });

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
        const paramInput = document.getElementById('crud-param-input');
        const method = item.methods || 'GET';

        if (methodEl) {
            methodEl.textContent = method;
            methodEl.className = `font-black text-sm ${this.getMethodColor(method)}`;
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
        
        if (paramInput) {
            paramInput.value = window.crudState.paramValue || '';
        }

        this.updateUrlDisplay();

        // Update Custom Presets Dropdown
        const presetsBtn = document.getElementById('crud-presets-btn');
        const presetsLabel = document.getElementById('crud-presets-label');
        const presetsMenu = document.getElementById('crud-presets-menu');

        if (presetsBtn && presetsMenu) {
            presetsMenu.innerHTML = ''; // Clear previous
            
            if (item.suggested && item.suggested.length > 0) {
                presetsBtn.disabled = false;
                presetsBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-700', 'hover:bg-gray-600', 'border-gray-600', 'text-gray-200');
                presetsBtn.classList.add('bg-green-600', 'hover:bg-green-500', 'border-green-500', 'text-white', 'shadow-lg', 'shadow-green-900/20');
                presetsLabel.textContent = `Presets (${item.suggested.length})`;
                
                // Add "Default" or custom options
                item.suggested.forEach((s, idx) => {
                    const btn = document.createElement('button');
                    btn.className = 'text-left px-4 py-2 text-xs text-gray-300 hover:bg-green-600/20 hover:text-green-200 transition-colors w-full border-b border-gray-700/50 last:border-0 flex items-center gap-2 group';
                    btn.innerHTML = `
                        <i class="fas fa-file-code text-gray-500 group-hover:text-green-400"></i>
                        <span class="font-medium">${s.name}</span>
                    `;
                    btn.onclick = () => {
                        this.applySuggestion(idx);
                        presetsMenu.classList.add('hidden');
                    };
                    presetsMenu.appendChild(btn);
                });

            } else {
                presetsBtn.disabled = true;
                presetsBtn.classList.remove('bg-green-600', 'hover:bg-green-500', 'border-green-500', 'text-white', 'shadow-lg', 'shadow-green-900/20');
                presetsBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-700', 'hover:bg-gray-600', 'border-gray-600', 'text-gray-200');
                presetsLabel.textContent = '[ No Suggestions ]';
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
        // Reset Params for new item
        window.crudState.paramValue = '';
        
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
            // Apply Content
            try {
                 const obj = JSON.parse(suggestion.content);
                 const pretty = JSON.stringify(obj, null, 2);
                 this.bodyEditor.setValue(pretty);
                 window.crudState.bodyValue = pretty;
            } catch(e) {
                 this.bodyEditor.setValue(suggestion.content);
                 window.crudState.bodyValue = suggestion.content;
            }

            // Apply URL Params
            const params = suggestion.urlparams || '';
            const paramInput = document.getElementById('crud-param-input');
            if (paramInput) {
                paramInput.value = params;
            }
            window.crudState.paramValue = params;
            this.updateUrlDisplay();
        }
    },

    updateUrlDisplay: function() {
        if (!window.crudState.currentItem) return;
        const root = document.getElementById('crud-root-url').value;
        const params = window.crudState.paramValue || '';
        const routeEl = document.getElementById('crud-info-route');
        if(routeEl) routeEl.textContent = `${root}${window.crudState.currentItem.route}${params}`;
    },

    sendRequest: async function() {
        const item = window.crudState.currentItem;
        if (!item) return;

        const root = document.getElementById('crud-root-url').value;
        const params = window.crudState.paramValue || '';
        const url = `${root}${item.route}${params}`;
        const methodLabel = item.methods || 'GET';
        // If method is STREAM, we actually send a GET request for simplicity, 
        // as standard browsers don't support custom 'STREAM' HTTP verb easily.
        const networkMethod = methodLabel === 'STREAM' ? 'GET' : methodLabel;
        
        const headerText = this.headerEditor.getValue();
        const bodyText = this.bodyEditor.getValue();

        let headers = {};
        try { headers = JSON.parse(headerText); } catch(e) { alert('Invalid Header JSON'); return; }

        let body = null;
        if (networkMethod !== 'GET' && networkMethod !== 'HEAD') {
             try { body = bodyText; JSON.parse(bodyText); } catch(e) { alert('Invalid Body JSON'); return; }
        }

        const timeEl = document.getElementById('crud-timer');
        timeEl.textContent = 'Wait...';
        
        this.startTime = performance.now();

        try {
            const options = {
                method: networkMethod,
                headers: headers,
                mode: 'cors'
            };
            if (body) options.body = body;
            
            // Clear Output for Stream start
            if (methodLabel === 'STREAM') {
                this.outputViewer.setValue('Connecting...'); 
            }

            const res = await fetch(url, options);
            
            // Handle STREAM
            if (methodLabel === 'STREAM' && res.body) {
                const reader = res.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let fullText = "";
                let firstChunk = true;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    fullText += chunk;
                    
                    // Update UI
                    if(firstChunk) {
                        this.outputViewer.setValue(fullText);
                        firstChunk = false;
                    } else {
                        // We set value repeatedly. If CrudOutput supports append that's better, 
                        // but setValue works for now.
                        this.outputViewer.setValue(fullText); 
                    }
                    
                    // Update timer live
                    const now = performance.now();
                    timeEl.textContent = `${(now - this.startTime).toFixed(0)} ms`;
                }
                
                // Final flush and formatted update
                const now = performance.now();
                timeEl.textContent = `${(now - this.startTime).toFixed(2)} ms`;

                // Try pretty print final result
                try {
                    const json = JSON.parse(fullText);
                    const pretty = JSON.stringify(json, null, 4);
                    this.outputViewer.setValue(pretty);
                    window.crudState.outputValue = pretty;
                } catch(e) {
                    window.crudState.outputValue = fullText;
                }
                return;
            }

            // Normal Request Handling
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
            window.crudState.outputValue = valToSet;

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

