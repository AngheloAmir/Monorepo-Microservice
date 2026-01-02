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
            "name": "customer",
            "description": "",
            "icon": "fa-brands fa-react",
            "type": "FRONTEND",
            "path": "/frontend/customer",
            "devurl": "http://localhost:3000/",
            "produrl": "",
            "startcmd": "",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "lintcmd": "",
            "template": "react_ts_tailwind_radix",
            "giturl": "",
            "gitorigin": "",
            "gitbranch": "",
            "installcmd": "",
            "testcmd": ""
        }
    ],
    "database": [],
    "service": []
}

module.exports = repository;
