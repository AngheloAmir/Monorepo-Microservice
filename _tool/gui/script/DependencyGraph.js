window.dependencyGraph = {
    state: {
        nodes: [],
        links: [],
        pan: { x: 0, y: 0 },
        scale: 1,
        isPanning: false,
        dragNode: null,
        lastMouse: { x: 0, y: 0 },
        width: 0,
        height: 0,
        animationId: null
    },

    init: function() {
        console.log("Initializing Interactive Dependency Graph...");
        this.render();
    },

    render: async function() {
        const container = document.getElementById('dependency-graph-container');
        if(!container) {
            console.warn("Dependency Graph container not found. Retrying in 500ms...");
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
        // Fallback dimensions if container (hidden) has 0 size
        this.state.width = container.clientWidth || 800;
        this.state.height = container.clientHeight || 400;
        this.state.pan = { x: this.state.width / 2, y: this.state.height / 2 };
        
        console.log("Graph Dimensions:", this.state.width, this.state.height);
        console.log("Raw Graph Data:", graphData);

        // 1. Process Data
        const nodesMap = new Map();
        const links = [];

        if (graphData && graphData.tasks) {
            graphData.tasks.forEach(task => {
                const pkg = task.taskId.split('#')[0];
                
                // Allow user to filter this via some UI later, for now hardcoded
                if(pkg === 'monorepo-tool') return;

                if (!nodesMap.has(pkg)) {
                    nodesMap.set(pkg, { 
                        name: pkg, 
                        x: (Math.random() - 0.5) * 100, 
                        y: (Math.random() - 0.5) * 100, 
                        vx: 0, vy: 0,
                        el: null 
                    });
                }
                
                if (task.dependencies) {
                    task.dependencies.forEach(dep => {
                        const depPkg = dep.split('#')[0];
                        if(depPkg === 'monorepo-tool' || depPkg === pkg) return;

                        if (!nodesMap.has(depPkg)) {
                            nodesMap.set(depPkg, { 
                                name: depPkg, 
                                x: (Math.random() - 0.5) * 100, 
                                y: (Math.random() - 0.5) * 100, 
                                vx: 0, vy: 0,
                                el: null
                            });
                        }
                        links.push({ source: pkg, target: depPkg });
                    });
                }
            });
        }
        
        this.state.nodes = Array.from(nodesMap.values());
        
        // Resolve link references
        this.state.links = links.map(l => ({
            source: nodesMap.get(l.source),
            target: nodesMap.get(l.target)
        })).filter(l => l.source && l.target);

        console.log("Processed Nodes:", this.state.nodes.length);

        if(this.state.nodes.length === 0) {
            container.innerHTML = '<div class="text-gray-500 text-xs flex items-center justify-center h-full">No graph data found or all filtered out.</div>';
            return;
        }

        // 2. Build SVG Structure
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        // Explicitly set viewBox to match convenient coordinate system if needed, 
        // but for now we use translation in a group.
        svg.style.cursor = "grab";
        
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <marker id="arrow" markerWidth="14" markerHeight="14" refX="28" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
            </marker>
             <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        `;
        svg.appendChild(defs);

        const viewport = document.createElementNS("http://www.w3.org/2000/svg", "g");
        viewport.setAttribute("transform", `translate(${this.state.pan.x}, ${this.state.pan.y})`);
        svg.appendChild(viewport);

        const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        viewport.appendChild(linkGroup);
        viewport.appendChild(nodeGroup);

        container.appendChild(svg);

        // 3. Create Elements
        this.state.links.forEach((link, idx) => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("stroke", "#4b5563");
            line.setAttribute("stroke-width", "1.5");
            line.setAttribute("opacity", "0.6");
            line.setAttribute("marker-end", "url(#arrow)");
            linkGroup.appendChild(line);
            link.el = line;
        });

        this.state.nodes.forEach(node => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.style.cursor = "pointer";
            g.dataset.nodeName = node.name;

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("r", "20");
            circle.setAttribute("fill", "#1f2937"); 
            circle.setAttribute("fill-opacity", "0.9");
            circle.setAttribute("stroke", "#3b82f6"); 
            circle.setAttribute("stroke-width", "2");
            circle.setAttribute("filter", "url(#glow)");
            
            const iconText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            iconText.setAttribute("dy", "5");
            iconText.setAttribute("text-anchor", "middle");
            iconText.setAttribute("fill", "#60a5fa");
            iconText.setAttribute("font-family", "FontAwesome");
            iconText.setAttribute("font-size", "14");
            
            // Icon Mapping
            if(node.name.includes('ui') || node.name.includes('shared')) iconText.textContent = '\uf5fd'; 
            else if(node.name.includes('api') || node.name.includes('backend')) iconText.textContent = '\uf1c0'; 
            else if(node.name.includes('web') || node.name.includes('app') || node.name.includes('admin')) iconText.textContent = '\uf108'; 
            else iconText.textContent = '\uf07b'; 

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("dy", "35");
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
            
            g.addEventListener('mousedown', (e) => {
                e.stopPropagation(); 
                this.state.dragNode = node;
                this.state.lastMouse = { x: e.clientX, y: e.clientY };
                node.vx = 0; node.vy = 0;
            });
        });

        // 4. Attach Global Events
        // Remove old listeners? Hard to do with anonymous functions. 
        // We can just rely on the fact that if this re-runs, old SVG is gone but window listeners remain.
        // Ideally we should use named functions for listeners to remove them.
        
        if (!this._listenersAttached) {
            svg.addEventListener('mousedown', (e) => {
                this.state.isPanning = true;
                this.state.lastMouse = { x: e.clientX, y: e.clientY };
                svg.style.cursor = "grabbing";
            });

            window.addEventListener('mousemove', (e) => {
                const dx = e.clientX - this.state.lastMouse.x;
                const dy = e.clientY - this.state.lastMouse.y;
                this.state.lastMouse = { x: e.clientX, y: e.clientY };

                if (this.state.dragNode) {
                    this.state.dragNode.x += dx;
                    this.state.dragNode.y += dy;
                    this.state.alpha = 1; 
                } else if (this.state.isPanning) {
                    this.state.pan.x += dx;
                    this.state.pan.y += dy;
                    viewport.setAttribute("transform", `translate(${this.state.pan.x}, ${this.state.pan.y})`);
                }
            });

            window.addEventListener('mouseup', () => {
                this.state.isPanning = false;
                this.state.dragNode = null;
                if(svg) svg.style.cursor = "grab";
            });
            
            this._listenersAttached = true;
        }

        // 5. Start Loop
        this.state.alpha = 1; 
        if(!this.state.animationId) {
             this.runSimulation();
        }
    },

    runSimulation: function() {
        // Simple Loop
        const loop = () => {
            if (this.state.nodes.length > 0 && (this.state.alpha > 0.01 || this.state.dragNode)) {
                this.updatePhysics();
                this.updateVisuals();
                this.state.alpha *= 0.99; 
            }
            this.state.animationId = requestAnimationFrame(loop);
        };
        loop();
    },

    updateVisuals: function() {
        this.state.nodes.forEach(n => {
            if(n.el) n.el.setAttribute("transform", `translate(${n.x}, ${n.y})`);
        });
        this.state.links.forEach(l => {
            if(l.el) {
                l.el.setAttribute("x1", l.source.x);
                l.el.setAttribute("y1", l.source.y);
                l.el.setAttribute("x2", l.target.x);
                l.el.setAttribute("y2", l.target.y);
            }
        });
    },

    updatePhysics: function() {
        const nodes = this.state.nodes;
        const links = this.state.links;
        const k = 150; 
        const repel = 600; 

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

                if (u !== this.state.dragNode) { u.vx -= fx; u.vy -= fy; }
                if (v !== this.state.dragNode) { v.vx += fx; v.vy += fy; }
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

            if (u !== this.state.dragNode) { u.vx += fx; u.vy += fy; }
            if (v !== this.state.dragNode) { v.vx -= fx; v.vy -= fy; }
        });

        // Center Gravity (weak)
        nodes.forEach(n => {
             // pull to 0,0 (relative to pan center)
             n.vx -= n.x * 0.01;
             n.vy -= n.y * 0.01;
        });

        // Update
        nodes.forEach(n => {
            if (n === this.state.dragNode) return;
            n.vx *= 0.8;
            n.vy *= 0.8;
            n.x += n.vx;
            n.y += n.vy;
        });
    }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.dependencyGraph.init();
} else {
    document.addEventListener('DOMContentLoaded', () => window.dependencyGraph.init());
}
