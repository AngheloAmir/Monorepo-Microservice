window.dependencyGraph = {
    state: {
        nodes: [],
        links: [],
        pan: { x: 0, y: 0 },
        scale: 1, // Prepare for future zooming
        isPanning: false,
        dragNode: null,
        lastMouse: { x: 0, y: 0 },
        width: 0,
        height: 0,
        viewport: null 
    },

    init: function() {
        console.log("Initializing Static Dependency Graph...");
        this.render();
    },

    render: async function() {
        const container = document.getElementById('dependency-graph-container');
        if(!container) {
            setTimeout(() => this.render(), 500);
            return;
        }

        container.innerHTML = '<div class="text-gray-500 text-xs italic flex items-center justify-center h-full"><i class="fas fa-circle-notch fa-spin mr-2"></i> Loading Graph...</div>';

        try {
            const res = await fetch('/api/changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-graph' })
            });
            const data = await res.json();
            if(data.error) throw new Error(data.error);

            this.setupGraph(container, data.graph);

        } catch (e) {
            console.error("Graph Error", e);
            container.innerHTML = `<div class="text-red-400 text-xs flex items-center justify-center h-full"><i class="fas fa-exclamation-triangle mr-1"></i> ${e.message}</div>`;
        }
    },

    setupGraph: function(container, graphData) {
        container.innerHTML = '';
        this.state.width = container.clientWidth || 800;
        this.state.height = container.clientHeight || 400;
        this.state.pan = { x: this.state.width / 2, y: this.state.height / 2 };
        
        // 1. Process Data
        const nodesMap = new Map();
        const links = [];

        if (graphData && graphData.tasks) {
            graphData.tasks.forEach(task => {
                const pkg = task.taskId.split('#')[0];
                if(pkg === 'monorepo-tool') return;

                if (!nodesMap.has(pkg)) {
                    nodesMap.set(pkg, { 
                        name: pkg, 
                        x: (Math.random() - 0.5) * 50, 
                        y: (Math.random() - 0.5) * 50,
                        vx: 0, vy: 0 
                    });
                }
                
                if (task.dependencies) {
                    task.dependencies.forEach(dep => {
                        const depPkg = dep.split('#')[0];
                        if(depPkg === 'monorepo-tool' || depPkg === pkg) return;

                        if (!nodesMap.has(depPkg)) {
                            nodesMap.set(depPkg, { 
                                name: depPkg, 
                                x: (Math.random() - 0.5) * 50, 
                                y: (Math.random() - 0.5) * 50, 
                                vx: 0, vy: 0 
                            });
                        }
                        links.push({ source: pkg, target: depPkg });
                    });
                }
            });
        }
        
        this.state.nodes = Array.from(nodesMap.values());
        this.state.links = links.map(l => ({
            source: nodesMap.get(l.source),
            target: nodesMap.get(l.target)
        })).filter(l => l.source && l.target);

        if(this.state.nodes.length === 0) {
            container.innerHTML = '<div class="text-gray-500 text-xs flex items-center justify-center h-full">No graph data found.</div>';
            return;
        }

        // 2. Pre-calculate Layout (Static Physics)
        console.log("Pre-calculating layout...");
        // Tighter constants
        const iterations = 300; 
        const k = 80;   // Ideal spring length (smaller = closer)
        const repel = 300; // Repulsion force (smaller = less push)
        
        for(let i=0; i<iterations; i++) {
            this.runPhysicsStep(k, repel);
        }
        console.log("Layout settled.");

        // 3. Build SVG
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.cursor = "grab";
        svg.style.userSelect = "none";
        
        // Definitions
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
            </marker>
             <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        `;
        svg.appendChild(defs);

        const viewport = document.createElementNS("http://www.w3.org/2000/svg", "g");
        viewport.setAttribute("transform", `translate(${this.state.pan.x}, ${this.state.pan.y})`);
        svg.appendChild(viewport);
        this.state.viewport = viewport;

        const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        viewport.appendChild(linkGroup);
        viewport.appendChild(nodeGroup);

        container.appendChild(svg);

        // 4. Create DOM Elements
        this.state.links.forEach(link => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("stroke", "#4b5563");
            line.setAttribute("stroke-width", "1.5");
            line.setAttribute("opacity", "0.6");
            line.setAttribute("marker-end", "url(#arrow)");
            
            // Initial position
            line.setAttribute("x1", link.source.x);
            line.setAttribute("y1", link.source.y);
            line.setAttribute("x2", link.target.x);
            line.setAttribute("y2", link.target.y);

            linkGroup.appendChild(line);
            link.el = line;
        });

        this.state.nodes.forEach(node => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.style.cursor = "pointer";
            g.setAttribute("transform", `translate(${node.x}, ${node.y})`);

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("r", "18");
            circle.setAttribute("fill", "#1f2937"); 
            circle.setAttribute("fill-opacity", "0.95");
            circle.setAttribute("stroke", "#3b82f6"); 
            circle.setAttribute("stroke-width", "2");
            circle.setAttribute("filter", "url(#glow)");
            
            const iconText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            iconText.setAttribute("dy", "5");
            iconText.setAttribute("text-anchor", "middle");
            iconText.setAttribute("fill", "#60a5fa");
            iconText.setAttribute("font-family", "FontAwesome");
            iconText.setAttribute("font-size", "14");
            
            if(node.name.includes('ui') || node.name.includes('shared')) iconText.textContent = '\uf5fd'; 
            else if(node.name.includes('api') || node.name.includes('backend')) iconText.textContent = '\uf1c0'; 
            else if(node.name.includes('web') || node.name.includes('app') || node.name.includes('admin')) iconText.textContent = '\uf108'; 
            else iconText.textContent = '\uf07b'; 

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("dy", "32");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", "#e5e7eb");
            text.setAttribute("font-size", "11");
            text.setAttribute("font-weight", "bold");
            text.style.pointerEvents = "none";
            text.textContent = node.name;

            g.appendChild(circle);
            g.appendChild(iconText);
            g.appendChild(text);
            nodeGroup.appendChild(g);
            node.el = g;

            // Drag Start
            g.addEventListener('mousedown', (e) => {
                e.stopPropagation(); 
                this.state.dragNode = node;
                this.state.lastMouse = { x: e.clientX, y: e.clientY };
            });
        });

        // 5. Global Interactio (Panning & Moving Dragged Node)
        
        // We attach to window/document to catch mouseup outside
        if(!this._hasListeners) {
            
            // PAN START
            svg.addEventListener('mousedown', (e) => {
                // Only left click
                if(e.button !== 0) return;
                this.state.isPanning = true;
                this.state.lastMouse = { x: e.clientX, y: e.clientY };
                svg.style.cursor = "grabbing";
            });

            // MOVE
            window.addEventListener('mousemove', (e) => {
                const dx = e.clientX - this.state.lastMouse.x;
                const dy = e.clientY - this.state.lastMouse.y;
                this.state.lastMouse = { x: e.clientX, y: e.clientY };

                if (this.state.dragNode) {
                    // Manual Move Node
                    this.state.dragNode.x += dx;
                    this.state.dragNode.y += dy;
                    this.updateVisualsSingle(this.state.dragNode);
                } else if (this.state.isPanning && this.state.viewport) {
                    // Manual Pan Viewport
                    this.state.pan.x += dx;
                    this.state.pan.y += dy;
                    this.state.viewport.setAttribute("transform", `translate(${this.state.pan.x}, ${this.state.pan.y})`);
                }
            });

            // STOP
            window.addEventListener('mouseup', () => {
                this.state.isPanning = false;
                this.state.dragNode = null;
                // Re-find svg if we lost ref? Or just assume existing ref is ok logic-wise.
                // We update cursor on the svg element from state.
                const currentSvg = document.querySelector('#dependency-graph-container svg');
                if(currentSvg) currentSvg.style.cursor = "grab";
            });

            this._hasListeners = true;
        }
    },

    runPhysicsStep: function(k, repel) {
        const nodes = this.state.nodes;
        const links = this.state.links;

        // Repulsion
        for(let i=0; i<nodes.length; i++) {
            for(let j=i+1; j<nodes.length; j++) {
                const u = nodes[i];
                const v = nodes[j];
                const dx = v.x - u.x;
                const dy = v.y - u.y;
                let distSq = dx*dx + dy*dy || 1;
                const dist = Math.sqrt(distSq);
                
                const force = (repel * repel) / distSq;
                const fx = (dx/dist) * force * 0.1;
                const fy = (dy/dist) * force * 0.1;

                u.vx -= fx; u.vy -= fy;
                v.vx += fx; v.vy += fy;
            }
        }

        // Springs
        links.forEach(l => {
            const u = l.source;
            const v = l.target;
            const dx = v.x - u.x;
            const dy = v.y - u.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            
            const force = (dist - k) * 0.05; 
            const fx = (dx/dist) * force;
            const fy = (dy/dist) * force;

            u.vx += fx; u.vy += fy;
            v.vx -= fx; v.vy -= fy;
        });

        // Center Gravity (To keep them in view)
        nodes.forEach(n => {
             n.vx -= n.x * 0.02;
             n.vy -= n.y * 0.02;
        });

        // Apply
        nodes.forEach(n => {
            n.vx *= 0.6; // Heavy damping for stability
            n.vy *= 0.6;
            n.x += n.vx;
            n.y += n.vy;
        });
    },

    updateVisualsSingle: function(node) {
        // Update just the dragged node and its connected links
        if(node.el) {
            node.el.setAttribute("transform", `translate(${node.x}, ${node.y})`);
        }
        // Find links
        this.state.links.forEach(l => {
            if(l.source === node || l.target === node) {
                 if(l.el) {
                    l.el.setAttribute("x1", l.source.x);
                    l.el.setAttribute("y1", l.source.y);
                    l.el.setAttribute("x2", l.target.x);
                    l.el.setAttribute("y2", l.target.y);
                 }
            }
        });
    }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.dependencyGraph.init();
} else {
    document.addEventListener('DOMContentLoaded', () => window.dependencyGraph.init());
}
