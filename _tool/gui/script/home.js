(function() {
    // Cleanup previous connection if it exists
    if (window.homeStatusEventSource) {
        window.homeStatusEventSource.close();
        window.homeStatusEventSource = null;
    }

    const startStream = () => {
        // If element is gone, stop stream
        if (!document.getElementById('sys-mem-val')) {
            if (window.homeStatusEventSource) {
                window.homeStatusEventSource.close();
                window.homeStatusEventSource = null;
            }
            return;
        }

        const evtSource = new EventSource("/api/system-status");
        window.homeStatusEventSource = evtSource;

        evtSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // If ID check fails mid-stream
                if (!document.getElementById('sys-mem-val')) {
                    evtSource.close();
                    return;
                }

                // Memory Logic (display server RAM usage)
                const usedMB = (data.serverUsedMem / (1024 * 1024)).toFixed(1);
                const sysPercent = (data.serverUsedMem / data.systemTotalMem) * 100;
                // Minimum visual bar 2%
                const visualPercent = Math.max(sysPercent, 2); 

                // Update Memory UI
                document.getElementById('sys-mem-val').innerText = `${usedMB} MB`;
                const memBar = document.getElementById('sys-mem-bar');
                if (memBar) memBar.style.width = `${visualPercent}%`;
                
                const memLabel = document.querySelector('#sys-mem-val').previousElementSibling;
                if(memLabel) memLabel.innerText = "Server RAM";

                // Update Counts
                document.getElementById('stat-repos-count').innerText = data.repoCount || 0;
                document.getElementById('stat-active-count').innerText = data.activeCount || 0;

                // Update CPU UI
                const cpuText = `${data.cpus} Cores`;
                document.getElementById('sys-cpu-val').innerText = cpuText;
                
                // Random visual pulse
                const randomCpu = Math.floor(Math.random() * 20) + 1; 
                const cpuBar = document.getElementById('sys-cpu-bar');
                if (cpuBar) cpuBar.style.width = `${randomCpu}%`;

            } catch (e) {
                console.error("Error parsing SSE data", e);
            }
        };

        evtSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            evtSource.close();
            // Optional: Retry logic could go here, but usually browser retries automatically.
        };
    };

    // Start immediately
    startStream();

})();
