/**
 * Repository Data
 */

const repository = {
    "backend": [],
    "frontend": [],
    "database": [],
    "service": [
        {
            "name": "my-service",
            "description": "132132",
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
