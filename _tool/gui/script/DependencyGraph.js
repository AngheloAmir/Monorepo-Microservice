window.dependencyGraph = {
    network: null,
    
    init: function() {
        console.log("Initializing Vis.js Dependency Graph...");
        this.render();
    },

    render: async function() {
        const container = document.getElementById('dependency-graph-container');
        if(!container) {
            setTimeout(() => this.render(), 500);
            return;
        }

        try {
            const res = await fetch('/api/changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-graph' })
            });
            const data = await res.json();
            if(data.error) throw new Error(data.error);

            this.buildNetwork(container, data.graph);

        } catch (e) {
            console.error("Graph Error", e);
            container.innerHTML = `<div class="text-red-400 text-xs flex items-center justify-center h-full"><i class="fas fa-exclamation-triangle mr-1"></i> ${e.message}</div>`;
        }
    },

    buildNetwork: function(container, graphData) {
        // 1. Process Nodes and Edges
        const nodes = [];
        const edges = [];
        const excluded = ['monorepo-tool', 'monorepo-turborepo'];
        
        // Track unique nodes to prevent duplications
        const nodeSet = new Set();
        // Calculate degrees to filter unconnected
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

                // Filter unconnected
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
                            code: isPackage ? '\uf1b2' : getIconCode(pkg), // cube vs others
                            weight: '900',
                            size: 35,
                            color: isPackage ? '#34d399' : '#60a5fa' 
                        },
                        font: {
                            color: '#e5e7eb',
                            size: 14,
                            vadjust: 5
                        }
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
                            length: 200 // spring length
                        });
                    }
                }
            });
        }

        if(nodes.length === 0) {
            container.innerHTML = '<div class="text-gray-500 text-xs flex items-center justify-center h-full">No connected nodes found.</div>';
            return;
        }

        // 2. Vis.js Options
        const options = {
            nodes: {
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.5)',
                    size: 10,
                    x: 5,
                    y: 5
                }
            },
            physics: {
                enabled: false, // Disabled active physics
                stabilization: {
                    enabled: true,
                    iterations: 1000, // Still stabilize at start to find positions
                    fit: true
                }
            },
            interaction: {
                dragNodes: true,
                dragView: true,
                zoomView: true
            }
        };

        // 3. Create Network
        const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
        this.network = new vis.Network(container, data, options);
    }
};

// Helper for icons
function getIconCode(name) {
    if(name.includes('api') || name.includes('backend')) return '\uf1c0'; // database
    if(name.includes('web') || name.includes('app') || name.includes('admin')) return '\uf108'; // desktop
    return '\uf07b'; // folder
}

// Initialize
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.dependencyGraph.init();
} else {
    document.addEventListener('DOMContentLoaded', () => window.dependencyGraph.init());
}
