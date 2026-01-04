/**
 * Workspace Data
 */

const workspace = {
    "backend": [
        {
            "name": "NodeJS",
            "description": "",
            "icon": "fa-brands fa-node-js",
            "type": "backend",
            "path": "/backend/NodeJS",
            "devurl": "http://localhost:8080",
            "produrl": "",
            "installcmd": "npm install",
            "devcmd": "ts-node src/index.ts",
            "startcmd": "node dist/index.js",
            "stopcmd": "npx -y kill-port 8080",
            "buildcmd": "tsc",
            "lintcmd": "",
            "testcmd": "",
            "template": "nodemon",
            "giturl": "",
            "gitorigin": "origin",
            "gitbranch": "master"
        }
    ],
    "frontend": [],
    "database": [],
    "service": []
}

module.exports = workspace;
