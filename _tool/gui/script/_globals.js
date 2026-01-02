//Define here the global variables=====================================================================

//Repository relative variables
window.repoNewHTML      = '';
window.repoOptionsHTML  = '';
window.repoCardHTML     = '';
window.cardRenderer     = null;
window.repoSections     = ['backend', 'database', 'frontend', 'service'];

//TabTerminal relative variables
window.tabTerminalItems     = {};
window.tabTerminalActiveId  = null;
window.tabTerminalContainer = null;

// CRUD Tester variables
window.crudTemplates = {}; // Cache HTML strings
window.crudState = {       // Persistent state
    currentItem: null,
    headerValue: '{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}',
    bodyValue: '{}',
    outputValue: '',
    suggestValue: '',
    rootUrl: localStorage.getItem('crud-root-url') || 'http://localhost:3200',
    expandedCategories: new Set() // Store indices of open categories
};