const fs = require('fs');
const path = require('path');

const VSCODE_DIR = path.join(__dirname, '../../.vscode');
const SETTINGS_FILE = path.join(VSCODE_DIR, 'settings.json');

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
    ".vscode":  true
};

// Patterns that match what the user wants to see "Shared, Backend, Frontend, Services, Database"
// We don't exclude these.

function handleToggleExclude(req, res) {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

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
        Object.keys(EXCLUDE_PATTERNS).forEach(key => {
            // If we are unhiding (newHiddenState is false), we set to false.
            // If we are hiding (newHiddenState is true), we set to EXCLUDE_PATTERNS[key] (which is true mostly)
            if (newHiddenState === false) {
                // If unhiding, check if it is in default exclude (always hidden)
                if (EXCLUDE_PATTERNS_DEFAULT[key]) {
                    settings['files.exclude'][key] = true;
                } else {
                    settings['files.exclude'][key] = false;
                }
            } else {
                settings['files.exclude'][key] = EXCLUDE_PATTERNS[key];
            }
        });

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
