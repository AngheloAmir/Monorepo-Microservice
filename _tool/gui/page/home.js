window.Pages = window.Pages || {};

window.Pages.home = () => {
    return `
        <div class="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
            <!-- Hero Section -->
            <div class="text-center space-y-4 py-10">
                <h1 class="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 tracking-tight">
                    Monorepo Microservice
                </h1>
                <p class="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                    Your central command unit for managing cloud environments, deployments, and testing suites.
                </p>
            </div>
            
            <!-- Dashboard Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Status Card -->
                <div class="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group cursor-pointer relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fas fa-server text-8xl text-blue-500"></i>
                    </div>
                    <div class="flex items-center justify-between mb-6 relative z-10">
                        <div class="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                            <i class="fas fa-microchip text-blue-400 text-xl"></i>
                        </div>
                        <span class="flex items-center gap-2 text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            Online
                        </span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2 relative z-10">System Status</h3>
                    <div class="space-y-2 relative z-10">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-400">Node Service</span>
                            <span class="text-white">Active</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-1.5">
                            <div class="bg-blue-500 h-1.5 rounded-full" style="width: 100%"></div>
                        </div>
                    </div>
                </div>

                <!-- Database Card -->
                <div class="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group cursor-pointer relative overflow-hidden">
                     <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fas fa-database text-8xl text-purple-500"></i>
                    </div>
                    <div class="flex items-center justify-between mb-6 relative z-10">
                        <div class="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                            <i class="fas fa-database text-purple-400 text-xl"></i>
                        </div>
                        <span class="text-xs font-mono text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full border border-gray-600">
                            v16.4
                        </span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2 relative z-10">Database</h3>
                    <p class="text-gray-400 text-sm mb-4 relative z-10">Local PostgreSQL instance connected and verified.</p>
                     <div class="flex -space-x-2 relative z-10">
                         <div class="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs text-white">DB</div>
                         <div class="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs text-white">RLS</div>
                     </div>
                </div>

                <!-- CI/CD Card -->
                <div class="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 group cursor-pointer relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fas fa-rocket text-8xl text-pink-500"></i>
                    </div>
                    <div class="flex items-center justify-between mb-6 relative z-10">
                        <div class="p-3 bg-pink-500/10 rounded-xl group-hover:bg-pink-500/20 transition-colors">
                            <i class="fas fa-check-circle text-pink-400 text-xl"></i>
                        </div>
                        <span class="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                            Passing
                        </span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2 relative z-10">Pipeline</h3>
                    <p class="text-gray-400 text-sm relative z-10">Last build successfully deployed to local environment.</p>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div class="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
                
                <div class="relative z-10">
                    <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <i class="fas fa-bolt text-yellow-400"></i> Quick Actions
                    </h2>
                    <div class="flex flex-wrap gap-4">
                        <button class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center gap-2 transform hover:-translate-y-0.5">
                             <i class="fas fa-play"></i> Launch All
                        </button>
                         <button class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all border border-gray-600 hover:border-gray-500 flex items-center gap-2 transform hover:-translate-y-0.5">
                             <i class="fas fa-sync"></i> Sync Repos
                        </button>
                        <button class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all border border-gray-600 hover:border-gray-500 flex items-center gap-2 transform hover:-translate-y-0.5">
                             <i class="fas fa-terminal"></i> Terminal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};
