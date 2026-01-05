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
                    document.getElementById('metric-ram-peak').innerText = `${displayPeak.toFixed(0)} MB`;
                } else {
                     document.getElementById('metric-ram-peak').innerText = `${peakMB.toFixed(0)} MB`;
                }

                // 1. Update Key Metrics
                document.getElementById('metric-ram-current').innerText = `${usedMB.toFixed(0)} MB`;
                document.getElementById('metric-proc-count').innerText = `${data.processes ? data.processes.length : 0} Active`;

                // 2. Update Map/List
                const listContainer = document.getElementById('process-list-container');
                if (listContainer && data.processes) {
                    // Sort by memory desc
                    const sorted = data.processes.sort((a,b) => b.memory - a.memory);
                    
                    let html = '';
                    sorted.forEach(p => {
                        const mem = (p.memory / (1024 * 1024)).toFixed(0);
                        // Icon based on type
                        let icon = 'fa-cog';
                        let color = 'text-gray-400';
                        if (p.type === 'System') { icon = 'fa-server'; color = 'text-blue-400'; }
                        if (p.type === 'Service') { icon = 'fa-microchip'; color = 'text-green-400'; }
                        if (p.type === 'Job') { icon = 'fa-tasks'; color = 'text-purple-400'; }

                        html += `
                        <div data-type="${p.type}" class="flex items-center justify-between p-1 rounded bg-gray-900/40 hover:bg-gray-800/60 border border-transparent hover:border-gray-700 transition-colors text-xs">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <i class="fas ${icon} ${color} w-4 text-center"></i>
                                <span class="text-gray-300 font-mono truncate" title="${p.name}">${p.name}</span>
                            </div>
                            <div class="flex items-center gap-3 flex-none">
                                <span class="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] text-gray-500">${p.pid}</span>
                                <span class="font-mono text-white w-20 text-right">
                                    <span class="text-orange-500">${mem}</span> MB
                                </span>
                            </div>
                        </div>`;
                    });
                    listContainer.innerHTML = html;
                }

                // 3. Update Docker List
                const dockerContainer = document.getElementById('docker-list-container');
                if (dockerContainer && data.dockerContainers) {
                     document.getElementById('docker-count').innerText = `${data.dockerContainers.length} Active`;
                     
                     // Format total memory
                     if (data.dockerTotalMem !== undefined) {
                         const memMB = (data.dockerTotalMem / (1024 * 1024)).toFixed(1);
                         const memGB = (data.dockerTotalMem / (1024 * 1024 * 1024)).toFixed(2);
                         const display = data.dockerTotalMem > 1073741824 ? `${memGB} GB` : `${memMB} MB`;
                         const memEl = document.getElementById('docker-mem-total');
                         if (memEl) memEl.innerText = display;
                     }

                     let html = '';
                     if (data.dockerContainers.length === 0) {
                        html = '<div class="text-center text-xs text-gray-500 py-4">No active containers</div>';
                        const stopAll = document.getElementById('docker-stop-all-btn');
                        if (stopAll) stopAll.classList.add('hidden');
                     } else {
                         const stopAll = document.getElementById('docker-stop-all-btn');
                         if (stopAll) stopAll.classList.remove('hidden');

                         data.dockerContainers.forEach(c => {
                             let statusColor = 'text-green-400';
                             if (c.status.includes('Exited')) statusColor = 'text-gray-500';
                             if (c.status.includes('Restarting')) statusColor = 'text-orange-400';
                             
                             html += `
                            <div class="flex items-center justify-between p-2 rounded bg-gray-900/40 border border-gray-700/30 text-xs">
                                <div class="flex flex-col gap-0.5 overflow-hidden">
                                    <div class="flex items-center gap-2">
                                        <i class="fab fa-docker text-blue-500"></i>
                                        <span class="text-gray-200 font-bold truncate" title="${c.name}">${c.name}</span>
                                    </div>
                                    <span class="text-gray-500 text-[10px] truncate" title="${c.image}">${c.image}</span>
                                </div>
                                <div class="flex items-center gap-3 flex-none ml-2">
                                    <div class="flex flex-col items-end gap-0.5">
                                        <span class="text-[10px] text-gray-400 font-mono">${c.memoryStr}</span>
                                        <span class="${statusColor} text-[10px] font-medium">${c.status}</span>
                                    </div>
                                    <button onclick="window.stopDockerContainer('${c.id}', '${c.name}')" 
                                        class="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors" title="Stop Container">
                                        <i class="fas fa-power-off"></i>
                                    </button>
                                </div>
                            </div>
                             `;
                         });
                     }
                     dockerContainer.innerHTML = html;
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

    // --- PORT REMOVER LOGIC ---
    const setupPortRemover = () => {
        // Find the button (heuristic: contains 'Port Remover')
        const buttons = Array.from(document.querySelectorAll('button'));
        const portBtn = buttons.find(b => b.innerText.includes('Port Remover'));
        
        if (portBtn) {
            portBtn.onclick = async () => {
                if (!window.openInputModal || !window.openAlertModal) {
                    console.error('Modal scripts not loaded');
                    return;
                }

                const port = await window.openInputModal(
                    'STOP PORT', 
                    'Enter the port number you want to force terminate (kill -9):', 
                    '3000'
                );

                if (port) {
                    try {
                        const res = await fetch('/api/kill-port', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ port: port })
                        });
                        const data = await res.json();
                        if (data.success) {
                            if (data.killed) await window.openAlertModal('Success', `Port ${port} killed successfully.`, 'success');
                            else await window.openAlertModal('Info', `No process found on port ${port}.`, 'info');
                        } else {
                            await window.openAlertModal('Error', data.error, 'error');
                        }
                    } catch (e) {
                         await window.openAlertModal('Error', 'Request failed', 'error');
                    }
                }
            };
        }
    };
    
    // --- DOCKER STOP LOGIC ---
    window.stopDockerContainer = async (id, name) => {
        if (!window.openConfirmModal) {
             const ok = confirm(`Stop container ${name} (${id})?`);
             if (!ok) return;
        } else {
             const ok = await window.openConfirmModal('Confirm Stop', `Are you sure you want to stop container ${name}?`);
             if (!ok) return;
        }
        
        try {
            const res = await fetch('/api/docker/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (!data.success) {
                if (window.openAlertModal) await window.openAlertModal('Error', data.error || 'Failed to stop', 'error');
                else alert(data.error || 'Failed to stop');
            }
            // No need to alert success, the list will update
        } catch(e) {
            console.error(e);
        }
    };

    const setupDockerStopAll = () => {
        const btn = document.getElementById('docker-stop-all-btn');
        if (btn) {
            btn.onclick = async () => {
                 if (!window.openConfirmModal) {
                     if (!confirm('Stop ALL running docker containers?')) return;
                 } else {
                     if (!await window.openConfirmModal('STOP ALL', 'Are you sure you want to stop ALL active containers?')) return;
                 }
                 
                 try {
                    const res = await fetch('/api/docker/stop-all', { method: 'POST' });
                    const data = await res.json();
                    if (!data.success) {
                         if (window.openAlertModal) await window.openAlertModal('Error', data.error || 'Failed to stop all', 'error');
                    }
                 } catch(e) {
                     console.error(e);
                 }
            };
        }
    }

    // --- VS CODE TOGGLE LOGIC ---
    const setupVscodeToggle = () => {
        const btn = document.getElementById('vscode-toggle-btn');
        if (btn) {
            btn.onclick = async () => {
                try {
                    const res = await fetch('/api/vscode/toggle-exclude', {
                        method: 'POST'
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        const icon = btn.querySelector('i');
                        if (data.hidden) {
                            if (window.openAlertModal) await window.openAlertModal('Success', 'Workspace Cleaned! (Files hidden)', 'success');
                            if (icon) {
                                icon.classList.remove('fa-eye-slash');
                                icon.classList.add('fa-eye');
                            }
                            const span = btn.querySelector('span');
                            if(span) span.innerText = "Show All Files";
                        } else {
                            if (window.openAlertModal) await window.openAlertModal('Success', 'All Files Visible!', 'success');
                            if (icon) {
                                icon.classList.remove('fa-eye');
                                icon.classList.add('fa-eye-slash');
                            }
                            const span = btn.querySelector('span');
                            if(span) span.innerText = "Clean View";
                        }
                    } else {
                        if (window.openAlertModal) await window.openAlertModal('Error', data.error, 'error');
                    }
                } catch (e) {
                     console.error(e);
                     if (window.openAlertModal) await window.openAlertModal('Error', 'Request failed', 'error');
                }
            };
        }
    };

    setTimeout(() => {
        startStream();
        setupPortRemover();
        setupDockerStopAll();
        setupVscodeToggle();
    }, 100);

})();
