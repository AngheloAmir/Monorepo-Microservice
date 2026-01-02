window.crudTesterLoader = async function() {
    console.log('Loading CRUD Tester...');
    
    // Check if dependencies are ready
    if (!window.AccordionNav || !window.CrudEditor) {
        console.warn('Dependencies (AccordionNav, CrudEditor) not fully loaded yet.');
        // They should be loaded by index.html inclusion, but let's be safe
    }

    try {
        const res = await fetch('/api/crud');
        if (!res.ok) throw new Error('Failed to fetch CRUD data');
        const data = await res.json();
        
        // Init Components
        await window.CrudEditor.init();
        await window.AccordionNav.init('crud-nav-container', data);
        
    } catch (e) {
        console.error('Error loading CRUD tester:', e);
        const container = document.getElementById('crud-nav-container');
        if(container) {
            container.innerHTML = `
                <div class="text-red-500 p-4 text-xs flex flex-col items-center justify-center h-40 text-center gap-2">
                    <i class="fas fa-exclamation-circle text-2xl"></i>
                    <span>Error loading data.<br>${e.message}</span>
                </div>`;
        }
    }
};
