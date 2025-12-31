const repository = {
    backend: [
    ],

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
        init:        "npm create react-app ."
        }
    ],

    database: [

    ],

    service: [

    ],
    
}

module.exports = repository;
