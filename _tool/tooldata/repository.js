/**
 * Repository Data
 */

const repository = {
    "backend": [
        {
            "name": "NodeJS",
            "description": "The main server of the app",
            "icon": "fas fa-cube",
            "type": "backend",
            "path": "/backend/NodeJS",
            "devurl": "http://localhost:8000",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "lintcmd": "npm run lint",
            "template": "node_ts_nodemon_jwt",
            "giturl": "temp",
            "gitorigin": "origin",
            "gitbranch": "master",
            "installcmd": "",
            "testcmd": "npm run test"
        }
    ],
    "frontend": [
        {
            "name": "customer",
            "description": "",
            "icon": "fas fa-cube",
            "type": "frontend",
            "path": "/frontend/customer",
            "devurl": "http://localhost:3000",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "lintcmd": "npm run lint23132",
            "template": "react_ts_tailwind_radix",
            "giturl": "temp32132",
            "gitorigin": "origin312",
            "gitbranch": "master3132"
        }
    ],
    "database": [],
    "service": []
}

module.exports = repository;
