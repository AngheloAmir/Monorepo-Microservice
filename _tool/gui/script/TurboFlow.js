window.TurboFlow = {
    network: null,
    data: { nodes: [], edges: [] },
    pipelineConfig: {}, // The raw pipeline object from turbo.json
    selectedNodeId: null,
    isLinking: false,
    initialized: false,

    init: async function() {
        console.log("TurboFlow Initializing...");
        
        if (this.initialized) {
            // Just refresh layout if already loaded
            if (this.network) {
                 this.network.fit();
            }
            return; 
        }

        await this.loadTurboJson();
        this.renderGraph();
        this.initialized = true;

        // Listen for graph clicks
        if(this.network) {
            this.network.on("click", (params) => {
                if (params.nodes.length > 0) {
                    this.onNodeSelected(params.nodes[0]);
                } else {
                    this.onGridSelected();
                }
            });
        }
    },

    loadTurboJson: async function() {
        try {
            // Using existing endpoint logic or creating a new minimal one?
            // Let's assume we use /api/turborepo/config or similar if available, 
            // but for now I'll use list-prunable or read file directly via new helper route if needed.
            // Actually, let's reuse api/activepipeline logic but with 'get-turbo-json' action.
            // I need to update pipelineeditorhelper.js potentially to support this.
            // For now, let's mock or try to fetch.
            
            const res = await fetch('/api/activepipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-turbo-json' })
            });
            const json = await res.json();
            
            if (json.pipeline) {
                this.pipelineConfig = json.pipeline;
                this.transformToGraphData();
            }
        } catch(e) {
            console.error("Failed to load turbo.json", e);
            // Default fallback
            this.pipelineConfig = {
                "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
                "test": { "dependsOn": ["build"], "outputs": [] },
                "lint": { "outputs": [] },
                "deploy": { "dependsOn": ["build", "test", "lint"], "cache": false }
            };
            this.transformToGraphData();
        }
    },

    transformToGraphData: function() {
        // Convert pipeline object to Vis.js format
        const nodes = [];
        const edges = [];
        const tasks = Object.keys(this.pipelineConfig);
        const addedNodes = new Set(tasks);

        tasks.forEach(task => {
            const config = this.pipelineConfig[task];
            
            // Add Node
            nodes.push({
                id: task,
                label: '📦 ' + task,
                shape: 'box',
                color: {
                    background: '#1f2937', 
                    border: '#3b82f6'
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
                        nodes.push({
                            id: from,
                            label: '📦 ' + from + ' (implicit)',
                            shape: 'box',
                            color: {
                                background: '#374151',
                                border: '#6b7280'
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

        this.data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    },

    renderGraph: function() {
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

        this.network = new vis.Network(container, this.data, options);
        
        this.network.on("click", (params) => {
            if (params.nodes.length > 0) {
                this.onNodeSelected(params.nodes[0]);
            } else {
                this.onGridSelected();
            }
        });
    },

    saveCurrentNodeState: function() {
        if (this.selectedNodeId && this.pipelineConfig[this.selectedNodeId]) {
             const config = this.pipelineConfig[this.selectedNodeId];
             
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
        if (this.isLinking) {
            this.handleLink(nodeId);
            return;
        }

        // Save previous
        this.saveCurrentNodeState();

        this.selectedNodeId = nodeId;
        
        // Show Config Panel
        document.getElementById('config-empty').classList.add('hidden');
        document.getElementById('config-form').classList.remove('hidden');
        document.getElementById('config-title').textContent = `Confgure: ${nodeId}`;

        const config = this.pipelineConfig[nodeId] || {};
        
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
        const sourceId = this.selectedNodeId;
        if (!sourceId || sourceId === targetId) {
            this.isLinking = false;
            document.body.style.cursor = 'default';
            return;
        }

        const config = this.pipelineConfig[sourceId];
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

        this.isLinking = false;
        document.body.style.cursor = 'default';
    },

    onGridSelected: function() {
        if (this.isLinking) {
            this.isLinking = false;
            document.body.style.cursor = 'default';
        }
        
        this.saveCurrentNodeState();
        this.selectedNodeId = null;
        document.getElementById('config-empty').classList.remove('hidden');
        document.getElementById('config-form').classList.add('hidden');
        document.getElementById('config-title').textContent = "No Task Selected";
    },

    startLinking: function() {
        if (!this.selectedNodeId) return;
        this.isLinking = true;
        document.body.style.cursor = 'crosshair';
        alert(`Select the task that "${this.selectedNodeId}" depends on.`);
    },

    addTask: function() {
        const name = prompt("Enter task name (e.g. 'e2e-test'):");
        if (name) {
            if (!this.pipelineConfig[name]) {
                this.pipelineConfig[name] = { cache: true };
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
        // Just trigger renderGraph which has physics enabled initially
        // Maybe stabilize
        if(this.network) {
            this.network.stabilize();
            this.network.fit();
        } else {
            this.renderGraph();
        }
    },

    removeDep: function(task, dep) {
        const config = this.pipelineConfig[task];
        if (config && config.dependsOn) {
            config.dependsOn = config.dependsOn.filter(d => d !== dep);
            // Update UI
            this.transformToGraphData();
            this.renderGraph();
            this.onNodeSelected(task); // Refresh config panel
        }
    },

    save: async function() {
        // Prepare payload
        // We probably need to update just the 'pipeline' key of turbo.json
        // But for now, we just sync the selected node config into state
        if (this.selectedNodeId) {
             const config = this.pipelineConfig[this.selectedNodeId];
             config.cache = document.getElementById('config-cache').checked;
             
             const inputs = document.getElementById('config-inputs').value.split(',').map(s => s.trim()).filter(Boolean);
             if (inputs.length > 0) config.inputs = inputs;
             else delete config.inputs;
             
             const outputs = document.getElementById('config-outputs').value.split(',').map(s => s.trim()).filter(Boolean);
             if (outputs.length > 0) config.outputs = outputs;
             else delete config.outputs;
        }

        try {
            const res = await fetch('/api/activepipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'save-turbo-json',
                    pipeline: this.pipelineConfig
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
