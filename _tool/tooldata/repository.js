/**
 * Repository Data
 */

const repository = {
    "backend": [
        {
            "name": "NodeJS",
            "description": "The main server of the app",
            "icon": "fa-brands fa-node-js",
            "type": "BACKEND",
            "path": "/backend/NodeJS",
            "devurl": "http://localhost:8000",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "lintcmd": "npm run lint",
            "template": "node_ts_nodemon_jwt",
            "giturl": "",
            "gitorigin": "",
            "gitbranch": "",
            "installcmd": "",
            "testcmd": "npm run test"
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
    "database": [],
    "service": []
}

module.exports = repository;
