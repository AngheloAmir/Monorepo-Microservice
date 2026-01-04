/**
 * Workspace Data
 */

const workspace = {
    "backend": [
        {
            "name": "NodeJS",
            "description": "The main server of the app",
            "icon": "fa-brands fa-node-js",
            "type": "backend",
            "path": "/backend/NodeJS",
            "devurl": "http://localhost:8080",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "lintcmd": "",
            "template": "node_ts_nodemon_jwt",
            "giturl": "",
            "gitorigin": "",
            "gitbranch": "",
            "installcmd": "npm install",
            "testcmd": ""
        }
    ],
    "frontend": [
        {
            "name": "MyReactApp",
            "description": "",
            "icon": "fa-brands fa-react",
            "type": "frontend",
            "path": "/frontend/MyReactApp",
            "devurl": "http://localhost:3000",
            "produrl": "",
            "installcmd": "npm install",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "lintcmd": "npm run lint",
            "testcmd": "",
            "template": "react_ts_tailwind_radix",
            "giturl": "",
            "gitorigin": "origin",
            "gitbranch": "master"
        }
    ],
    "database": [
        {
            "name": "Supabase",
            "description": "",
            "icon": "fas fa-database",
            "type": "database",
            "path": "/database/Supabase",
            "devurl": "http://127.0.0.1:54323",
            "produrl": "",
            "installcmd": "npm install",
            "startcmd": "npm run start",
            "stopcmd": "npm run stop",
            "buildcmd": "",
            "lintcmd": "",
            "testcmd": "",
            "template": "supabase",
            "giturl": "",
            "gitorigin": "origin",
            "gitbranch": "master"
        }
    ],
    "service": []
}

module.exports = workspace;
