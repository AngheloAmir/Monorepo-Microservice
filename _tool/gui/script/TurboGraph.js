window.TurboGraph = {
    network: null,
    
    init: function() {
        console.log("Initializing Turbo Graph...");
        this.render();
    },

    render: function() {
        const container = document.getElementById('turbo-graph-container');
        if(!container) return;

        if (window.turboGraphData) {
            container.innerHTML = ''; 
            this.buildNetwork(container, window.turboGraphData);
        } else {
            this.fetchAndRender(container);
        }
    },
    
    refresh: function() {
        const container = document.getElementById('turbo-graph-container');
        if(!container) return;
        
        // Show loading state
        container.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center text-gray-500">
            <i class="fas fa-circle-notch fa-spin mr-2"></i> Loading Graph...
        </div>`;
        
        this.fetchAndRender(container);
    },

    fetchAndRender: async function(container) {
        try {
            const res = await fetch('/api/turborepo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-graph' })
            });
            const data = await res.json();
            if(data.error) throw new Error(data.error);

            window.turboGraphData = data.graph; // Cache it
            
            container.innerHTML = ''; // Clear loading
            this.buildNetwork(container, data.graph);

        } catch (e) {
            console.error("Graph Error", e);
            if(container)
                container.innerHTML = `<div class="text-red-400 text-xs flex items-center justify-center h-full"><i class="fas fa-exclamation-triangle mr-1"></i> ${e.message}</div>`;
        }
    },

    buildNetwork: function(container, graphData) {
        // Reuse logic from DependencyGraph
        // 1. Process Nodes and Edges
        const nodes = [];
        const edges = [];
        const excluded = ['monorepo-tool', 'monorepo-turborepo'];
        
        const nodeSet = new Set();
        const degrees = new Map(); 

        if (graphData && graphData.tasks) {
            // First pass: Collect all potential edges to calculate degrees
            const rawEdges = [];
            graphData.tasks.forEach(task => {
                const pkg = task.taskId.split('#')[0];
                if(excluded.includes(pkg)) return;

                if(task.dependencies) {
                     task.dependencies.forEach(dep => {
                        const depPkg = dep.split('#')[0];
                        if(excluded.includes(depPkg) || depPkg === pkg) return;
                        
                        rawEdges.push({ from: pkg, to: depPkg });
                        degrees.set(pkg, (degrees.get(pkg)||0) + 1);
                        degrees.set(depPkg, (degrees.get(depPkg)||0) + 1);
                     });
                }
            });

            // Second pass: Build Node list
            graphData.tasks.forEach(task => {
                const pkg = task.taskId.split('#')[0];
                if(excluded.includes(pkg)) return;

                if(!degrees.has(pkg) || degrees.get(pkg) === 0) return;

                if (!nodeSet.has(pkg)) {
                    nodeSet.add(pkg);
                    const isPackage = pkg.startsWith('@');
                    const label = pkg.replace(/^@monorepo\//, '');
                    
                    nodes.push({
                        id: pkg,
                        label: label,
                        shape: 'icon',
                        icon: {
                            face: '"Font Awesome 5 Free"',
                            code: isPackage ? '\uf1b2' : this.getIconCode(pkg),
                            weight: '900',
                            size: 35,
                            color: isPackage ? '#34d399' : '#60a5fa' 
                        },
                        font: { color: '#e5e7eb', size: 14, vadjust: 5 }
                    });
                }
            });

            // Build Unique Edges
            const edgeSet = new Set();
            rawEdges.forEach(edge => {
                if(nodeSet.has(edge.from) && nodeSet.has(edge.to)) {
                    const id = `${edge.from}-${edge.to}`;
                    if(!edgeSet.has(id)) {
                        edgeSet.add(id);
                        edges.push({
                            from: edge.from,
                            to: edge.to,
                            arrows: 'to',
                            color: { color: '#4b5563', opacity: 0.5 },
                            width: 1.5,
                            length: 200
                        });
                    }
                }
            });
        }

        if(nodes.length === 0) {
            container.innerHTML = '<div class="text-gray-500 text-xs flex items-center justify-center h-full">No connected nodes found.</div>';
            return;
        }

        const options = {
            nodes: {
                shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 5, y: 5 }
            },
            physics: {
                enabled: false,
                stabilization: { enabled: true, iterations: 1000, fit: true }
            },
            interaction: {
                dragNodes: true, dragView: true, zoomView: true
            }
        };

        const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
        this.network = new vis.Network(container, data, options);
    },
    
    getIconCode: function(name) {
        if(name.includes('api') || name.includes('backend')) return '\uf1c0'; 
        if(name.includes('web') || name.includes('app') || name.includes('admin')) return '\uf108';
        return '\uf07b'; 
    }
};
