{
    const mockRuns = [
        {
            id: 'run-8832',
            pipeline: 'Deploy Backend Production',
            trigger: 'Commit by anghelo',
            status: 'running',
            startTime: '2 mins ago',
            duration: 'Running...',
            steps: [
                { name: 'Build', status: 'success' },
                { name: 'Test', status: 'success' },
                { name: 'Dockerize', status: 'running' },
                { name: 'Deploy', status: 'pending' },
            ]
        },
        {
            id: 'run-8831',
            pipeline: 'Frontend Integration Tests',
            trigger: 'Merge Request #42',
            status: 'success',
            startTime: '1 hour ago',
            duration: '4m 12s',
            steps: [
                { name: 'Install', status: 'success' },
                { name: 'Lint', status: 'success' },
                { name: 'Unit Tests', status: 'success' },
                { name: 'E2E', status: 'success' },
            ]
        },
        {
            id: 'run-8830',
            pipeline: 'Database Migration',
            trigger: 'Manual',
            status: 'failed',
            startTime: '3 hours ago',
            duration: '45s',
            steps: [
                { name: 'Backup', status: 'success' },
                { name: 'Migrate', status: 'failed' },
                { name: 'Cleanup', status: 'pending' },
            ]
        },
        {
            id: 'run-8829',
            pipeline: 'Service A Build',
            trigger: 'Schedule',
            status: 'success',
            startTime: '5 hours ago',
            duration: '1m 20s',
             steps: [
                { name: 'Build', status: 'success' },
                { name: 'Publish', status: 'success' },
            ]
        }
    ];

    const mockPipelines = [
        { id: 'p1', name: 'Deploy Backend Production', lastRun: 'success' },
        { id: 'p2', name: 'Frontend Integration Tests', lastRun: 'success' },
        { id: 'p3', name: 'Database Migration', lastRun: 'failed' },
        { id: 'p4', name: 'Service A Build', lastRun: 'success' },
        { id: 'p5', name: 'Service B Build', lastRun: 'success' },
        { id: 'p6', name: 'Deploy All Staging', lastRun: 'success' },
    ];

    window.initCicdPage = function() {
        console.log('CI/CD Page Loaded');
        renderRuns(mockRuns);
        renderPipelines(mockPipelines);
    };

    window.refreshCicd = function() {
        const btn = document.querySelector('button i.fa-sync-alt');
        if(btn) btn.classList.add('fa-spin');
        
        // Simulate network delay
        setTimeout(() => {
            renderRuns(mockRuns);
            if(btn) btn.classList.remove('fa-spin');
        }, 800);
    };

    window.triggerQuickAction = function(action) {
        alert(`Triggered action: ${action}\n(This is a UI mockup)`);
    };

    function renderRuns(runs) {
        const container = document.getElementById('cicd-runs-list');
        if (!container) return;

        let html = '';
        runs.forEach(run => {
            const statusConfig = getStatusConfig(run.status);
            
            // Steps Visualization
            const stepsHtml = run.steps.map((step, idx) => {
                let color = 'bg-gray-700';
                if (step.status === 'success') color = 'bg-green-500';
                if (step.status === 'failed') color = 'bg-red-500';
                if (step.status === 'running') color = 'bg-yellow-500 animate-pulse';
                
                // Connector line
                const line = idx < run.steps.length - 1 
                    ? `<div class="h-0.5 w-6 bg-gray-700 mx-1"></div>` 
                    : '';

                return `
                    <div class="flex items-center group/step relative">
                        <div class="w-3 h-3 rounded-full ${color}" title="${step.name}: ${step.status}"></div>
                        ${line}
                        <!-- Tooltip -->
                        <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded border border-gray-700 opacity-0 group-hover/step:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            ${step.name}
                        </div>
                    </div>
                `;
            }).join('');


            html += `
                <div class="bg-gray-800 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-all group relative overflow-hidden">
                    <!-- Status Strip -->
                    <div class="absolute left-0 top-0 bottom-0 w-1 ${statusConfig.bg}"></div>

                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg ${statusConfig.bgIcon} flex items-center justify-center ${statusConfig.text}">
                                <i class="fas ${statusConfig.icon}"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-sm hover:text-blue-400 cursor-pointer transition-colors">${run.pipeline}</h3>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <span class="text-xs text-gray-400 font-mono">${run.id}</span>
                                    <span class="text-gray-600">•</span>
                                    <span class="text-xs text-gray-500 max-w-[150px] truncate"><i class="fas fa-code-branch text-[10px] mr-1"></i> ${run.trigger}</span>
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                             <div class="inline-flex items-center px-2.5 py-1 ${statusConfig.badgeBg} ${statusConfig.badgeText} border ${statusConfig.badgeBorder} rounded-md text-[10px] uppercase font-bold tracking-wide">
                                ${run.status}
                            </div>
                            <div class="text-[11px] text-gray-500 mt-1.5 flex flex-col gap-0.5">
                                <span><i class="far fa-clock mr-1"></i> ${run.startTime}</span>
                                <span><i class="fas fa-stopwatch mr-1"></i> ${run.duration}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Pipeline Steps Visual -->
                    <div class="flex items-center mt-2 pl-14 opacity-80">
                         ${stepsHtml}
                    </div>
                    
                    <!-- Hover Action -->
                    <div class="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors border border-gray-600">
                            Details <i class="fas fa-arrow-right ml-1"></i>
                        </button>
                    </div>

                </div>
            `;
        });
        container.innerHTML = html;
    }

    function renderPipelines(pipelines) {
        const container = document.getElementById('cicd-pipelines-list');
        if (!container) return;

        let html = '';
        pipelines.forEach(p => {
             let statusColor = 'text-green-400';
             let icon = 'fa-check-circle';
             if (p.lastRun === 'failed') { statusColor = 'text-red-400'; icon = 'fa-times-circle'; }

             html += `
                <div class="group flex items-center justify-between p-2 hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors">
                    <div class="flex items-center gap-3 min-w-0">
                         <div class="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-blue-500 transition-colors"></div>
                         <span class="text-xs text-gray-300 font-medium truncate group-hover:text-white transition-colors">${p.name}</span>
                    </div>
                    <div class="flex items-center gap-2 pl-2">
                        <span class="text-[10px] text-gray-500 hidden group-hover:inline transition-all">#821</span>
                        <i class="fas ${icon} ${statusColor} text-xs opacity-70"></i>
                         <button class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-600 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                             <i class="fas fa-play text-[10px]"></i>
                        </button>
                    </div>
                </div>
             `;
        });
        container.innerHTML = html;
    }

    function getStatusConfig(status) {
        if (status === 'success') {
            return {
                bg: 'bg-green-500',
                bgIcon: 'bg-green-500/10',
                text: 'text-green-400',
                icon: 'fa-check',
                badgeBg: 'bg-green-500/10',
                badgeText: 'text-green-400',
                badgeBorder: 'border-green-500/20'
            };
        }
        if (status === 'running') {
              return {
                bg: 'bg-yellow-500',
                bgIcon: 'bg-yellow-500/10',
                text: 'text-yellow-400',
                icon: 'fa-sync-alt fa-spin',
                badgeBg: 'bg-yellow-500/10',
                badgeText: 'text-yellow-400',
                badgeBorder: 'border-yellow-500/20'
            };
        }
        if (status === 'failed') {
             return {
                bg: 'bg-red-500',
                bgIcon: 'bg-red-500/10',
                text: 'text-red-400',
                icon: 'fa-times',
                badgeBg: 'bg-red-500/10',
                badgeText: 'text-red-400',
                badgeBorder: 'border-red-500/20'
            };
        }
        return { // Pending / Default
            bg: 'bg-gray-500',
            bgIcon: 'bg-gray-500/10',
            text: 'text-gray-400',
            icon: 'fa-clock',
            badgeBg: 'bg-gray-500/10',
            badgeText: 'text-gray-400',
            badgeBorder: 'border-gray-500/20'
        };
    }

    // Auto Init
    initCicdPage();
}
