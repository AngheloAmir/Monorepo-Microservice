//Define here the global variables=====================================================================

//Workspace relative variables
window.workspaceNewHTML      = '';
window.workspaceOptionsHTML  = '';
window.workspaceCardHTML     = '';
window.cardRenderer     = null;
window.workspaceSections     = ['backend', 'database', 'frontend', 'service'];

//TabTerminal relative variables
window.tabTerminalItems     = {};
window.tabTerminalActiveId  = null;
window.tabTerminalContainer = null;

// CRUD Tester variables
window.crudTemplates = {}; // Cache HTML strings
window.crudState = {       // Persistent state
    currentItem: null,
    headerValue: '{\n  "Content-Type": "application/json",\n  "Accept": "application/json",\n  "Authorization": "Bearer token",\n  "x-refresh-token": "refresh-token",\n  "X-CSRF-Token": "csrf-token-placeholder",\n  "Cache-Control": "no-cache"\n}',
    bodyValue: '{}',
    outputValue: '',
    suggestValue: '',
    rootUrl: localStorage.getItem('crud-root-url') || 'http://localhost:3200',
    paramValue: '',
    paramValue: '',
    expandedCategories: new Set() // Store indices of open categories
};

// Turborepo Cache
window.turboGraphData = null;
window.turboGraphInstance = null;
window.componentCache = {};
// Home/Dashboard State
window.homeState = {
    peakMemory: 0,
    eventSource: null
};