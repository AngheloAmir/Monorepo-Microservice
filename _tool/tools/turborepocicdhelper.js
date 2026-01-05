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

const TEMPLATES = {
    'github': `name: CI

on:
  push:
    branches: ["main"]
  pull_request:
    types: [opened, synchronize]

jobs:
  build:
    name: Build and Test
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
      - name: Check out code
        uses: actions/checkout@v3
        with:
          fetch-depth: 2

      - name: Setup Node.js environment
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npx turbo run build

      - name: Test
        run: npx turbo run test

      - name: Lint
        run: npx turbo run lint
`,
    'gitlab': `image: node:latest

stages:
  - build

build:
  stage: build
  script:
    - npm ci
    - npx turbo run build test lint
  cache:
    paths:
      - node_modules/
`,
    'circleci': `version: 2.1
jobs:
  build:
    docker:
      - image: cimg/node:18.16.0
    environment:
      TURBO_UI: false
    steps:
      - checkout
      - run:
          name: Install Dependencies
          command: npm ci
      - run:
          name: Build, Test, Lint
          command: npx turbo run build test lint

workflows:
  version: 2
  build_and_test:
    jobs:
      - build
`,
    'travis': `language: node_js
node_js:
  - 18
cache:
  directories:
    - node_modules
script:
  - npm ci
  - npx turbo run build test lint
`,
    'buildkite': `steps:
  - label: ":node: Build, Test, and Lint"
    plugins:
      - docker#v3.5.0:
          image: "node:18"
    commands:
      - npm ci
      - npx turbo run build test lint
`
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
             // Handle no body nicely
             let data = {};
             try { if(body) data = JSON.parse(body); } catch(e) {}

             const relativePath = CI_FILES[provider];
             if (!relativePath) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid provider' }));
                return;
            }
            const filePath = path.join(PROJECT_ROOT, relativePath);

             if (action === 'save') {
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
             } else if (action === 'create') {
                 // Use template
                 const template = TEMPLATES[provider];
                 if (!template) {
                     res.writeHead(400, { 'Content-Type': 'application/json' });
                     res.end(JSON.stringify({ error: 'No template for this provider' }));
                     return;
                 }
                 
                 try {
                     const dir = path.dirname(filePath);
                     if (!fs.existsSync(dir)) {
                         fs.mkdirSync(dir, { recursive: true });
                     }
                    fs.writeFileSync(filePath, template);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, content: template }));
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
