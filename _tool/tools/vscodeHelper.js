const fs = require('fs');
const path = require('path');

const VSCODE_DIR = path.join(__dirname, '../../.vscode');
const SETTINGS_FILE = path.join(VSCODE_DIR, 'settings.json');

const { activeProcesses } = require('./runcmddev_shared');

const EXCLUDE_PATTERNS = {
    "**/node_modules": true,
    "**/.git":          true,
    "**/.gitignore":    true,
    "**/.turbo":        true,
    "**/dist":          true,
    "**/_tool":         true,
    "**/package-lock.json":  true,
    "**/Dockerfile":         true,
    "**/docker-compose.yml": true,
    "**/.dockerignore":  true,
    "**/turbo.json":     true,
    "**/nodemon.json":   true,
    "**/.turbo":         true,
    "**/temp.md":        true,
    "**/*postcss*":      true,
    "**/*tailwind*":     true,
    "**/*tsconfig*":     true,
    "**/*eslint*":       true,
    "**/*prettier*":     true,
    "**/*vite*":         true,
    "feat.md":           true,
    ".gitignore":        true,
    ".vscode":           true,
    "package.json":      true,
    "README.md":         true

    //no essential when programming
};

const EXCLUDE_PATTERNS_DEFAULT = {
    "**/.git":  true,
    ".vscode":  true,
    ".turbo":   true
};

// Patterns that match what the user wants to see "Shared, Backend, Frontend, Services, Database"
// We don't exclude these.

function handleToggleExclude(req, res) {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }


    console.log( activeProcesses );
    
    try {
        if (!fs.existsSync(VSCODE_DIR)) {
            fs.mkdirSync(VSCODE_DIR, { recursive: true });
        }

        let settings = {};
        if (fs.existsSync(SETTINGS_FILE)) {
            try {
                const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
                settings = JSON.parse(content);
            } catch (e) {
                console.error("Error reading settings.json", e);
                // If invalid JSON, start fresh or error? 
                // Let's assume we can overwrite if it's broken or just try to merge.
                // Safest is to error if we can't parse user's existing settings.
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to parse existing settings.json' }));
                return;
            }
        }

        // Initialize files.exclude if not present
        if (!settings['files.exclude']) {
            settings['files.exclude'] = {};
        }

        // Check current state. If ANY of our target patterns are true, we assume we are in "Hidden" mode -> switch to "Visible"
        // But the user might have mixed state.
        // Let's check "**/node_modules" as the flag.
        const isHidden = settings['files.exclude']['**/node_modules'] === true;

        const newHiddenState = !isHidden;

        // Apply new state
        // Apply new state
        Object.keys(EXCLUDE_PATTERNS).forEach(key => {
            // If we are unhiding (newHiddenState is false), we set to false.
            if (newHiddenState === false) {
                // If unhiding, check if it is in default exclude (always hidden)
                if (EXCLUDE_PATTERNS_DEFAULT[key]) {
                     settings['files.exclude'][key] = true;
                } else {
                     settings['files.exclude'][key] = false;
                }
            } else {
                // Hiding: Apply exclude patterns
                settings['files.exclude'][key] = EXCLUDE_PATTERNS[key];
            }
        });

        // --- ACTIVE WORKSPACE FOCUS LOGIC ---
        // 1. Identify all active directory paths (normalized)
        const activePaths = new Set();
        activeProcesses.forEach(proc => {
            if (proc.shouldRun && proc.config && proc.config.directory) {
                let dir = proc.config.directory.replace(/\\/g, '/');
                if (dir.startsWith('/')) dir = dir.substring(1);
                activePaths.add(dir);
            }
        });

        const SCAN_ROOTS = ['backend', 'frontend', 'service', 'database', 'shared'];
        const ROOT_DIR = path.resolve(__dirname, '../../');

        if (newHiddenState === true) {
            // "Clean View" ON
            if (activePaths.size > 0) {
                // FOCUS MODE: Scan each root.
                // If a root has active children, show the root, but hide inactiv children.
                // If a root has NO active children, hide the root entirely.

                SCAN_ROOTS.forEach(root => {
                    const rootPath = path.join(ROOT_DIR, root);
                    if (!fs.existsSync(rootPath)) return;

                    let hasActiveChildInRoot = false;

                    try {
                        const children = fs.readdirSync(rootPath, { withFileTypes: true });
                        let directoryChildren = [];

                        children.forEach(child => {
                            if (child.isDirectory()) {
                                directoryChildren.push(child.name);
                                const relPath = `${root}/${child.name}`;
                                
                                // Check if this specific child is active
                                if (activePaths.has(relPath)) {
                                    hasActiveChildInRoot = true;
                                    // It is running, so ensure it is Visible
                                    settings['files.exclude'][`**/${relPath}`] = false;
                                } else {
                                    // It is NOT running, so Hide it (potentially)
                                    // We'll set it to hidden for now.
                                    // But wait, if we hide the ROOT later, this is redundant but harmless.
                                    settings['files.exclude'][`**/${relPath}`] = true; 
                                }
                            }
                        });


                    } catch (e) {
                        console.error(`Error scanning ${root}`, e);
                    }

                    if (!hasActiveChildInRoot) {
                        // Optimization: Hide the entire root folder if nothing inside is running
                        settings['files.exclude'][`**/${root}`] = true;
                    } else {
                        // Root has something running.
                        // Ensure Root itself is visible
                        settings['files.exclude'][`**/${root}`] = false;
                    } 
                });

            } else {
                // Clean View ON but NO active processes -> Just show structure, hide garbage
                SCAN_ROOTS.forEach(root => {
                    settings['files.exclude'][`**/${root}`] = false;
                     // Also ensure we blindly unhide children if they were previously hidden
                    const rootPath = path.join(ROOT_DIR, root);
                    if (fs.existsSync(rootPath)) {
                        try {
                            const sub = fs.readdirSync(rootPath, { withFileTypes: true });
                            sub.forEach(c => {
                                if(c.isDirectory()) settings['files.exclude'][`**/${root}/${c.name}`] = false;
                            });
                        } catch(e){}
                    }
                });
            }

        } else {
            // Clean View OFF -> Show Everything
            SCAN_ROOTS.forEach(root => {
                settings['files.exclude'][`**/${root}`] = false;
                
                // Attempt to cleanup sub-folder entries
                const rootPath = path.join(ROOT_DIR, root);
                if (fs.existsSync(rootPath)) {
                    try {
                        const sub = fs.readdirSync(rootPath, { withFileTypes: true });
                        sub.forEach(c => {
                            if(c.isDirectory()) {
                                settings['files.exclude'][`**/${root}/${c.name}`] = false;
                            }
                        });
                    } catch(e){}
                }
            });
        }

        // Write back
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 4));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            hidden: newHiddenState,
            message: newHiddenState ? 'Files hidden' : 'Files visible'
        }));

    } catch (e) {
        console.error("Error toggling exclude:", e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
}

module.exports = { handleToggleExclude };
