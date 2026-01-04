window.dependencyGraph = {
    init: function() {
        console.log("Initializing Dependency Graph...");
        this.render();
    },

    render: async function() {
        const container = document.getElementById('dependency-graph-container');
        if(!container) return;

        container.innerHTML = '<div class="text-gray-500 text-xs italic"><i class="fas fa-circle-notch fa-spin mr-2"></i> Loading Graph...</div>';

        try {
            // Fetch full graph from backend
            const res = await fetch('/api/changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-graph' })
            });
            const data = await res.json();

            if(data.error) throw new Error(data.error);

            this.drawGraph(container, data.graph);

        } catch (e) {
            console.error("Graph Error", e);
            container.innerHTML = `<div class="text-red-400 text-xs"><i class="fas fa-exclamation-triangle mr-1"></i> Failed to load graph</div>`;
        }
    },

    drawGraph: function(container, graphData) {
        // Simple Force-Directed Graph using HTML/CSS or Canvas?
        // Let's use a simple HTML node renderer for "glass" effect matching aesthetics.
        
        container.innerHTML = ''; // Clear loading
        
        // Extract meaningful nodes (packages) and edges (dependencies)
        // input graphData is { packages: [], tasks: [{ taskId, dependencies }] }
        
        const nodes = new Set();
        const edges = [];

        if (graphData.tasks) {
            graphData.tasks.forEach(task => {
                const pkg = task.taskId.split('#')[0];
                nodes.add(pkg);
                
                if (task.dependencies) {
                    task.dependencies.forEach(dep => {
                        const depPkg = dep.split('#')[0];
                        if (depPkg !== pkg) {
                            edges.push({ from: pkg, to: depPkg });
                        }
                    });
                }
            });
        }
        
        const nodeList = Array.from(nodes);
        if(nodeList.length === 0) {
            container.innerHTML = '<div class="text-gray-500 text-xs">No dependencies found.</div>';
            return;
        }

        // Create a simple SVG visualizer
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        
        container.appendChild(svg);
        
        // Simple layout: Circle layout
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        
        const nodeEls = {};

        nodeList.forEach((node, idx) => {
            const angle = (idx / nodeList.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            nodeEls[node] = { x, y };
            
            // Draw Edges First (so they are behind)
            // We'll filter edges later if we want unique ones, but simplistic is fine
        });

        // Draw Edges
        edges.forEach(edge => {
            const source = nodeEls[edge.from];
            const target = nodeEls[edge.to];
            
            if (source && target) {
                 const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                 line.setAttribute("x1", source.x);
                 line.setAttribute("y1", source.y);
                 line.setAttribute("x2", target.x);
                 line.setAttribute("y2", target.y);
                 line.setAttribute("stroke", "#4b5563"); // gray-600
                 line.setAttribute("stroke-width", "1");
                 line.setAttribute("opacity", "0.5");
                 // Marker
                 line.setAttribute("marker-end", "url(#arrow)");
                 svg.appendChild(line);
            }
        });
        
        // Add Marker definition
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="16" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
            </marker>
        `;
        svg.appendChild(defs);

        // Draw Nodes
        nodeList.forEach(node => {
            const pos = nodeEls[node];
            
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
            
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("r", "16");
            circle.setAttribute("fill", "#1f2937"); // gray-800
            circle.setAttribute("stroke", "#3b82f6"); // blue-500
            circle.setAttribute("stroke-width", "2");
            
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("dy", "28");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", "#e5e7eb"); // gray-200
            text.setAttribute("font-size", "10");
            text.textContent = node;
            
            group.appendChild(circle);
            group.appendChild(text);
            svg.appendChild(group);
        });

    }
};

// Initialize if loaded dynamically
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.dependencyGraph.init();
} else {
    document.addEventListener('DOMContentLoaded', () => window.dependencyGraph.init());
}
