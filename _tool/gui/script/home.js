(function() {
    // Cleanup previous connection if it exists
    if (window.homeState && window.homeState.eventSource) {
        window.homeState.eventSource.close();
        window.homeState.eventSource = null;
    }

    const startStream = () => {
        const titleEl = document.getElementById('metric-ram-current');
        if (!titleEl) return;

        const evtSource = new EventSource("/api/system-status");
        
        // Store in global state
        if (window.homeState) {
            window.homeState.eventSource = evtSource;
        }

        evtSource.onmessage = (event) => {
            try {
                if (!document.getElementById('metric-ram-current')) {
                    evtSource.close();
                    if (window.homeState) window.homeState.eventSource = null;
                    return;
                }

                const data = JSON.parse(event.data);
                const usedMB = data.serverUsedMem / (1024 * 1024); // MB float
                const peakMB = data.peakMem / (1024 * 1024);

                // Update Peak in Global State if higher (optional client side tracking)
                if (window.homeState) {
                    if (usedMB > window.homeState.peakMemory) {
                        window.homeState.peakMemory = usedMB;
                    }
                    // Use server provided peak, or client observed peak?
                    // Usually server peak is better as it sees between 3s intervals.
                    // But if server restarts, client peak persists.
                    // Let's display the max of both.
                    const displayPeak = Math.max(peakMB, window.homeState.peakMemory);
                    document.getElementById('metric-ram-peak').innerText = `${displayPeak.toFixed(1)} MB`;
                } else {
                     document.getElementById('metric-ram-peak').innerText = `${peakMB.toFixed(1)} MB`;
                }

                // 1. Update Key Metrics
                document.getElementById('metric-ram-current').innerText = `${usedMB.toFixed(1)} MB`;
                document.getElementById('metric-proc-count').innerText = `${data.processes ? data.processes.length : 0} Active`;

                // 2. Update Map/List
                const listContainer = document.getElementById('process-list-container');
                if (listContainer && data.processes) {
                    // Sort by memory desc
                    const sorted = data.processes.sort((a,b) => b.memory - a.memory);
                    
                    let html = '';
                    sorted.forEach(p => {
                        const mem = (p.memory / (1024 * 1024)).toFixed(1);
                        // Icon based on type
                        let icon = 'fa-cog';
                        let color = 'text-gray-400';
                        if (p.type === 'System') { icon = 'fa-server'; color = 'text-blue-400'; }
                        if (p.type === 'Service') { icon = 'fa-microchip'; color = 'text-green-400'; }
                        if (p.type === 'Job') { icon = 'fa-tasks'; color = 'text-purple-400'; }

                        html += `
                        <div class="flex items-center justify-between p-2 rounded bg-gray-900/40 hover:bg-gray-800/60 border border-transparent hover:border-gray-700 transition-colors text-xs">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <i class="fas ${icon} ${color} w-4 text-center"></i>
                                <span class="text-gray-300 font-mono truncate" title="${p.name}">${p.name}</span>
                            </div>
                            <div class="flex items-center gap-3 flex-none">
                                <span class="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] text-gray-500">${p.pid}</span>
                                <span class="font-mono text-white w-14 text-right">${mem} MB</span>
                            </div>
                        </div>`;
                    });
                    listContainer.innerHTML = html;
                }

            } catch (e) {
                console.error("Error parsing SSE data", e);
            }
        };

        evtSource.onerror = (err) => {
            console.error("SSE Error:", err);
            evtSource.close();
        };
    };

    setTimeout(startStream, 100);

})();
