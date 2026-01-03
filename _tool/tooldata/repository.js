/**
 * Repository Data
 */

const repository = {
    "backend": [
        {
            "name": "NodeJS",
            "description": "The main server of the app",
            "icon": "fa-brands fa-node-js",
            "type": "backend",
            "path": "/backend/NodeJS",
            "devurl": "http://localhost:8000",
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
    "database": [],
    "service": [
        {
            "name": "empty",
            "description": "",
            "icon": "fa fa-cube",
            "type": "service",
            "path": "/service/empty",
            "devurl": "localhost:3000",
            "produrl": "",
            "installcmd": "",
            "startcmd": "npm run dev",
            "stopcmd": "",
            "buildcmd": "",
            "lintcmd": "",
            "testcmd": "",
            "template": "None",
            "giturl": "",
            "gitorigin": "origin",
            "gitbranch": "master"
        }
    ]
}

module.exports = repository;
