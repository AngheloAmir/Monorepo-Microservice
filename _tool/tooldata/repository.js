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
            "branch": "master",
            "devurl": "http://localhost:8000",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "template": "node_ts_nodemon_jwt"
        }
    ],
    "frontend": [
        {
            "name": "customer",
            "description": "",
            "icon": "fas fa-cube",
            "type": "frontend",
            "path": "/frontend/customer",
            "branch": "master",
            "devurl": "http://localhost:3000",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "template": "react_ts_tailwind_radix"
        }
    ],
    "database": [],
    "service": [
        {
            "name": "my-service1",
            "description": "",
            "icon": "fas fa-cube",
            "type": "service",
            "path": "/service/my-service1",
            "branch": "master",
            "devurl": "http://localhost:3000",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "template": ""
        },
        {
            "name": "my-service12",
            "description": "",
            "icon": "fas fa-cube",
            "type": "service",
            "path": "/service/my-service12",
            "branch": "master",
            "devurl": "http://localhost:3000",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "template": ""
        },
        {
            "name": "my-service124",
            "description": "",
            "icon": "fas fa-cube",
            "type": "service",
            "path": "/service/my-service124",
            "branch": "master",
            "devurl": "http://localhost:3000",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "template": ""
        }
    ]
}

module.exports = repository;
