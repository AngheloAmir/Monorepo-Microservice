/**
 * Workspace Data
 */

const workspace = {
    "backend": [
        {
            "name": "nodejs",
            "description": "Primary API Server",
            "icon": "fa-brands fa-node-js",
            "type": "backend",
            "path": "/backend/nodejs",
            "devurl": "http://localhost:8080",
            "produrl": "",
            "giturl": "",
            "gitorigin": "origin",
            "gitbranch": "master",
            "template": "None"
        }
    ],
    "frontend": [
        {
            "name": "food-shop",
            "description": "Frontend for customer",
            "icon": "fa-solid fa-user",
            "type": "frontend",
            "path": "/frontend/food-shop",
            "devurl": "http://localhost:3002",
            "produrl": "",
            "template": "reactapp",
            "giturl": "",
            "gitorigin": "origin",
            "gitbranch": "master"
        },
        {
            "name": "admin-panel",
            "description": "Private App",
            "icon": "fa-brands fa-react",
            "type": "frontend",
            "path": "/frontend/admin-panel",
            "devurl": "http://localhost:3001",
            "produrl": "",
            "template": "reactapp",
            "giturl": "",
            "gitorigin": "origin",
            "gitbranch": "master"
        }
    ],
    "database": [],
    "service": []
}

module.exports = workspace;
