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
window.crudDevUrl = 'http://localhost:3200';
window.crudProdUrl = 'https://production-url-placeholder.com';
window.crudUseProd = false;

window.crudState = {       // Persistent state
    currentItem: null,
    headerValue: '{\n  "Content-Type": "application/json",\n  "Accept": "application/json",\n  "Authorization": "Bearer token",\n  "x-refresh-token": "refresh-token",\n  "X-CSRF-Token": "csrf-token-placeholder",\n  "Cache-Control": "no-cache"\n}',
    bodyValue: '{}',
    outputValue: '',
    suggestValue: '',
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

// TurboControl
window.turboConsoleInstance = null;
window.turboCIConsoleInstance = null;

// TurboFlow State
window.turboFlowState = {
    network: null,
    data: { nodes: [], edges: [] },
    pipelineConfig: {},
    selectedNodeId: null,
    isLinking: false,
    initialized: false,
    availableScripts: new Set()
};