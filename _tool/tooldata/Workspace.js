/**
 * Workspace Data
 */

const workspace = {
    "backend": [
        {
            "name": "NodeJS",
            "description": "Primary API Server",
            "icon": "fa-brands fa-node-js",
            "type": "backend",
            "path": "/backend/NodeJS",
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
            "name": "FoodShop",
            "description": "Frontend for customer",
            "icon": "fa-solid fa-user",
            "type": "frontend",
            "path": "/frontend/FoodShop",
            "devurl": "http://localhost:3001",
            "produrl": "",
            "template": "reactapp",
            "giturl": "",
            "gitorigin": "origin",
            "gitbranch": "master"
        },
        {
            "name": "AdminPanel",
            "description": "Private App",
            "icon": "fa-brands fa-react",
            "type": "frontend",
            "path": "/frontend/AdminPanel",
            "devurl": "http://localhost:3002",
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
