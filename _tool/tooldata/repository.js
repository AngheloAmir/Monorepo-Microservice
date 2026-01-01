/**
 * {
        name:        "temp repo",
        description: "this is a temp repo for testing",
        icon:        "fa fa-html5",
        type:        "frontend",
        branch:      "master",
        path:        "../frontend/temp",
        devurl:      "http://localhost:3000",
        produrl:     "http://localhost:3000",
        startcmd:    "npm run dev",
        stopcmd:     "npm run stop",
        buildcmd:    "npm run build",
        template:    ""
        },
 */

const repository = {
    backend: [ ],

    frontend: [
        {
            name:        "temp repo",
            description: "this is a temp repo for testing",
            icon:        "fa fa-html5",
            type:        "frontend",
            path:        "../frontend/temp",
            branch:      "master",
            devurl:      "http://localhost:3000",
            produrl:     "http://localhost:3000",
            startcmd:    "npm run dev",
            stopcmd:     "npm run stop",
            buildcmd:    "npm run build",
            template:    ""
        }
    ],

    database: [
    ],

    service: [
        {
            name:        "my-service",
            description: "",
            icon:        "fas fa-cube",
            type:        "service",
            path:        "../service/my-service",
            branch:      "master",
            devurl:      "http://localhost:3000",
            produrl:     "",
            startcmd:    "npm run dev",
            stopcmd:     "npm run stop",
            buildcmd:    "npm run build",
            template:    "react_ts_tailwind_radix"
        },
    ],
    
}

module.exports = repository;
