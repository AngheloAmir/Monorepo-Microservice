window.TurboFlow = {
    // State is now in window.turboFlowState handled by _globals.js

    init: async function() {
        console.log("TurboFlow Initializing...");
        const state = window.turboFlowState;
        
        if (state.initialized) {
            // Just refresh layout if already loaded
            if (state.network) {
                 state.network.fit();
            }
            return; 
        }

        await Promise.all([
            this.loadTurboJson(),
            this.fetchScripts()
        ]);
        
        this.renderGraph();
        state.initialized = true;

        // Listen for graph clicks
        if (state.network) {
            state.network.on("click", (params) => {
                if (params.nodes.length > 0) {
                    this.onNodeSelected(params.nodes[0]);
                } else {
                    this.onGridSelected();
                }
            });
        }
    },

    fetchScripts: async function() {
        try {
            const res = await fetch('/api/activepipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-workspaces' })
            });
            const json = await res.json();
            if (json.workspaces) {
                // Reset set to ensure fresh data if re-fetched, though strictly we append here.
                // Creating new set or clearing might be better?
                // window.turboFlowState.availableScripts.clear(); // If we want to refresh
                json.workspaces.forEach(ws => {
                    if (ws.scripts) {
                        Object.keys(ws.scripts).forEach(s => window.turboFlowState.availableScripts.add(s));
                    }
                });
            }
        } catch(e) {
            console.error("Failed to fetch workspaces", e);
        }
    },

    loadTurboJson: async function() {
        try {
            const res = await fetch('/api/activepipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-turbo-json' })
            });
            const json = await res.json();
            
            if (json.pipeline) {
                window.turboFlowState.pipelineConfig = json.pipeline;
                this.transformToGraphData();
            }
        } catch(e) {
            console.error("Failed to load turbo.json", e);
            window.turboFlowState.pipelineConfig = {
                "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
                "test": { "dependsOn": ["build"], "outputs": [] },
                "lint": { "outputs": [] },
                "deploy": { "dependsOn": ["build", "test", "lint"], "cache": false }
            };
            this.transformToGraphData();
        }
    },

    transformToGraphData: function() {
        const state = window.turboFlowState;
        // Convert pipeline object to Vis.js format
        const nodes = [];
        const edges = [];
        const tasks = Object.keys(state.pipelineConfig);
        const addedNodes = new Set(tasks);

        tasks.forEach(task => {
            const config = state.pipelineConfig[task];
            const hasScript = state.availableScripts.has(task);
            
            // Add Node
            nodes.push({
                id: task,
                label: (hasScript ? '📦 ' : '⚠️ ') + task,
                shape: 'box',
                color: {
                    background: hasScript ? '#1f2937' : '#7f1d1d', 
                    border: hasScript ? '#3b82f6' : '#ef4444'
                },
                font: { color: '#ffffff', size: 14 },
                heightConstraint: { minimum: 30 },
                widthConstraint: { minimum: 80 },
                margin: 5 
            });

            // Add Edges
            if (config.dependsOn) {
                config.dependsOn.forEach(dep => {
                    // special case: ^topo
                    let from = dep;
                    let dashed = false;
                    
                    if (dep.startsWith('^')) {
                        from = dep.substring(1); 
                        dashed = true;
                    }

                    // implicit nodes handling
                    if (!addedNodes.has(from) && from !== task) {
                        const implicitHasScript = state.availableScripts.has(from);
                        nodes.push({
                            id: from,
                            label: (implicitHasScript ? '📦 ' : '⚠️ ') + from + ' (implicit)',
                            shape: 'box',
                            color: {
                                background: implicitHasScript ? '#374151' : '#450a0a',
                                border: implicitHasScript ? '#6b7280' : '#b91c1c'
                            },
                             font: { color: '#9ca3af', size: 14 },
                            heightConstraint: { minimum: 30 },
                            widthConstraint: { minimum: 80 },
                            margin: 5
                        });
                        addedNodes.add(from);
                    }

                    // Check if self-dep (topo)
                    if (from === task && dep.startsWith('^')) {
                         return;
                    }
                    
                    edges.push({
                        from: from,
                        to: task,
                        arrows: 'to',
                        dashes: dashed,
                        color: { color: dashed ? '#6b7280' : '#4ade80' }
                    });
                });
            }
        });

        state.data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    },

    renderGraph: function() {
        const state = window.turboFlowState;
        const container = document.getElementById('flow-network');
        if (!container) return; // Not visible yet

        const options = {
            physics: {
                enabled: false
            },
            layout: {
                hierarchical: {
                    enabled: false
                }
            },
            interaction: {
                hover: true,
                dragView: true,
                zoomView: true,
                dragNodes: true 
            },
            edges: {
                smooth: {
                    type: 'continuous',
                    roundness: 0
                }
            }
        };

        state.network = new vis.Network(container, state.data, options);
        
        state.network.on("click", (params) => {
            if (params.nodes.length > 0) {
                this.onNodeSelected(params.nodes[0]);
            } else {
                this.onGridSelected();
            }
        });
    },

    saveCurrentNodeState: function() {
        const state = window.turboFlowState;
        if (state.selectedNodeId && state.pipelineConfig[state.selectedNodeId]) {
             const config = state.pipelineConfig[state.selectedNodeId];
             
             // Check if element exists (panel might be hidden)
             const cacheEl = document.getElementById('config-cache');
             if(cacheEl) config.cache = cacheEl.checked;
             
             const inputsEl = document.getElementById('config-inputs');
             if(inputsEl) {
                 const inputs = inputsEl.value.split(',').map(s => s.trim()).filter(Boolean);
                 if (inputs.length > 0) config.inputs = inputs;
                 else delete config.inputs;
             }
             
             const outputsEl = document.getElementById('config-outputs');
             if(outputsEl) {
                 const outputs = outputsEl.value.split(',').map(s => s.trim()).filter(Boolean);
                 if (outputs.length > 0) config.outputs = outputs;
                 else delete config.outputs;
             }
        }
    },

    onNodeSelected: function(nodeId) {
        const state = window.turboFlowState;
        if (state.isLinking) {
            this.handleLink(nodeId);
            return;
        }

        // Save previous
        this.saveCurrentNodeState();

        state.selectedNodeId = nodeId;
        
        // Show Config Panel
        document.getElementById('config-empty').classList.add('hidden');
        document.getElementById('config-form').classList.remove('hidden');
        document.getElementById('config-title').textContent = `Confgure: ${nodeId}`;

        const config = state.pipelineConfig[nodeId] || {};
        
        document.getElementById('config-cache').checked = config.cache !== false; 
        document.getElementById('config-inputs').value = (config.inputs || []).join(', ');
        document.getElementById('config-outputs').value = (config.outputs || []).join(', ');

        const depsContainer = document.getElementById('config-deps');
        depsContainer.innerHTML = '';
        if (config.dependsOn) {
            config.dependsOn.forEach(dep => {
                const chip = document.createElement('span');
                chip.className = "px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded border border-gray-600 flex items-center gap-1";
                chip.innerHTML = `${dep} <i class="fas fa-times cursor-pointer hover:text-red-400 ml-1"></i>`;
                chip.querySelector('i').onclick = (e) => {
                    e.stopPropagation();
                    this.removeDep(nodeId, dep);
                };
                depsContainer.appendChild(chip);
            });
        }
    },

    handleLink: function(targetId) {
        const state = window.turboFlowState;
        const sourceId = state.selectedNodeId;
        if (!sourceId || sourceId === targetId) {
            state.isLinking = false;
            document.body.style.cursor = 'default';
            return;
        }

        const config = state.pipelineConfig[sourceId];
        if (!config.dependsOn) config.dependsOn = [];
        
        if (!config.dependsOn.includes(targetId)) {
            config.dependsOn.push(targetId);
            
            // Validate Cycle (simple check)
            // If I add B to A, I need to check if A is reachable from B?
            // For now, let's just add it. Turbo will complain if invalid.
            
            this.transformToGraphData();
            this.renderGraph();
            
            // Re-select source to show updated deps
            this.onNodeSelected(sourceId);
        }

        state.isLinking = false;
        document.body.style.cursor = 'default';
    },

    onGridSelected: function() {
        const state = window.turboFlowState;
        if (state.isLinking) {
            state.isLinking = false;
            document.body.style.cursor = 'default';
        }
        
        this.saveCurrentNodeState();
        state.selectedNodeId = null;
        document.getElementById('config-empty').classList.remove('hidden');
        document.getElementById('config-form').classList.add('hidden');
        document.getElementById('config-title').textContent = "No Task Selected";
    },

    startLinking: function() {
        const state = window.turboFlowState;
        if (!state.selectedNodeId) return;
        state.isLinking = true;
        document.body.style.cursor = 'crosshair';
        alert(`Select the task that "${state.selectedNodeId}" depends on.`);
    },

    addTask: function() {
        const state = window.turboFlowState;
        const name = prompt("Enter task name (e.g. 'e2e-test'):");
        if (name) {
            if (!state.pipelineConfig[name]) {
                state.pipelineConfig[name] = { cache: true };
                // Re-transform instead of manual add to ensure consistent state
                this.transformToGraphData();
                this.renderGraph();
                this.onNodeSelected(name);
            } else {
                alert('Task already exists!');
            }
        }
    },
    
    autoLayout: function() {
        const state = window.turboFlowState;
        // Just trigger renderGraph which has physics enabled initially
        // Maybe stabilize
        if(state.network) {
            state.network.stabilize();
            state.network.fit();
        } else {
            this.renderGraph();
        }
    },

    removeDep: function(task, dep) {
        const state = window.turboFlowState;
        const config = state.pipelineConfig[task];
        if (config && config.dependsOn) {
            config.dependsOn = config.dependsOn.filter(d => d !== dep);
            // Update UI
            this.transformToGraphData();
            this.renderGraph();
            this.onNodeSelected(task); // Refresh config panel
        }
    },

    save: async function() {
        const state = window.turboFlowState;
        // Prepare payload
        // We probably need to update just the 'pipeline' key of turbo.json
        // But for now, we just sync the selected node config into state
        if (state.selectedNodeId) {
            this.saveCurrentNodeState();
        }

        try {
            const res = await fetch('/api/activepipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'save-turbo-json',
                    pipeline: state.pipelineConfig
                })
            });
            
            if(res.ok) {
                alert('Turbo.json updated successfully!');
            } else {
                alert('Failed to update turbo.json');
            }
        } catch(e) {
            console.error(e);
            alert('Error saving flow');
        }
    }
};
