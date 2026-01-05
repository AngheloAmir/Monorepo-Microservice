const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

const CI_FILES = {
    'github': '.github/workflows/ci.yml',
    'gitlab': '.gitlab-ci.yml',
    'circleci': '.circleci/config.yml',
    'travis': '.travis.yml',
    'buildkite': '.buildkite/pipeline.yml',
    'vercel': 'vercel.json'
};

const DOCS_LINKS = {
    'github': 'https://turborepo.com/docs/guides/ci-vendors/github-actions',
    'gitlab': 'https://turborepo.com/docs/guides/ci-vendors/gitlab-ci',
    'circleci': 'https://turborepo.com/docs/guides/ci-vendors/circleci',
    'travis': 'https://turborepo.com/docs/guides/ci-vendors/travis-ci',
    'buildkite': 'https://turborepo.com/docs/guides/ci-vendors/buildkite',
    'vercel': 'https://turborepo.com/docs/guides/ci-vendors/vercel'
};

exports.handleTurboCIRequest = async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action');
    const provider = url.searchParams.get('provider');

    if (req.method === 'GET') {
        if (action === 'load' && provider) {
            const relativePath = CI_FILES[provider];
            if (!relativePath) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid provider' }));
                return;
            }
            const filePath = path.join(PROJECT_ROOT, relativePath);
            try {
                const docUrl = DOCS_LINKS[provider];
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ content, filePath: relativePath, docUrl, exists: true }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ content: '', filePath: relativePath, docUrl, exists: false }));
                }
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing action or provider' }));
        }
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
             const data = JSON.parse(body);
             
             if (action === 'save') {
                 const relativePath = CI_FILES[provider];
                 if (!relativePath) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid provider' }));
                    return;
                }
                const filePath = path.join(PROJECT_ROOT, relativePath);
                try {
                    // Ensure dir exists
                     const dir = path.dirname(filePath);
                     if (!fs.existsSync(dir)) {
                         fs.mkdirSync(dir, { recursive: true });
                     }
                    fs.writeFileSync(filePath, data.content);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
             } else {
                 res.writeHead(400, { 'Content-Type': 'application/json' });
                 res.end(JSON.stringify({ error: 'Invalid action' }));
             }
        });
    }
};
