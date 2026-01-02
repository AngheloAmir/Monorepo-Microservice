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
    "service": [
        {
            "name": "test",
            "description": "",
            "icon": "fa fa-cube",
            "type": "SERVICE",
            "path": "/service/test",
            "devurl": "localhost:3000",
            "produrl": "",
            "installcmd": "",
            "startcmd": "1321",
            "stopcmd": "",
            "buildcmd": "",
            "lintcmd": "",
            "testcmd": "",
            "template": "None",
            "giturl": "",
            "gitorigin": "origin",
            "gitbranch": "master"
        },
        {
            "name": "test22",
            "description": "",
            "icon": "fa fa-cube",
            "type": "SERVICE",
            "path": "/service/test22",
            "devurl": "localhost:3000",
            "produrl": "",
            "installcmd": "",
            "startcmd": "asdasd asd as",
            "stopcmd": "",
            "buildcmd": "",
            "lintcmd": "",
            "testcmd": "",
            "template": "None",
            "giturl": "hhhhhh",
            "gitorigin": "origin",
            "gitbranch": "master"
        }
    ]
}

module.exports = repository;
