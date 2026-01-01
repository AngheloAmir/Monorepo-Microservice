/**
 * Repository Data
 */

const repository = {
    "backend": [
        {
            "name": "my-service",
            "description": "",
            "icon": "fas fa-cube",
            "type": "backend",
            "path": "../backend/my-service",
            "branch": "master",
            "devurl": "http://localhost:3000",
            "produrl": "",
            "startcmd": "npm run dev",
            "stopcmd": "npm run stop",
            "buildcmd": "npm run build",
            "template": ""
        }
    ],
    "frontend": [],
    "database": [],
    "service": [
        {
            "name": "my-service",
            "description": "",
            "icon": "fas fa-cube",
            "type": "service",
            "path": "../service/my-service",
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
