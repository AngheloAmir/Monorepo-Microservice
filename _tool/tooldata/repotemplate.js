const repotemplate = [
    {
        templatename: "[Frontend] React TS Tailwind Radix Jan2026",
        templatepath: "react_ts_tailwind_radix",
        type:         "frontend",
        installcmd:   "npm install",
        startcmd:     "npm run dev",
        stopcmd:      "npm run stop",
        buildcmd:     "npm run build",
        lintcmd:      "npm run lint",
        testcmd:      "npm run test"
    },
    {
        templatename: "[Backend] Node TS Nodemon Jan2026",
        templatepath: "node_ts_nodemon_jwt",
        type:         "backend",
        installcmd:   "npm install",
        startcmd:     "npm run dev",
        stopcmd:      "npm run stop",
        buildcmd:     "npm run build",
        lintcmd:      "npm run lint",
        testcmd:      "npm run test"
    },
    {
        templatename: "[Backend] PHP Vanilla",
        templatepath: "php_vanilla",
        type:         "backend",
        installcmd:   "docker compose up -d --build",
        startcmd:     "docker compose up -d",
        stopcmd:      "docker compose down",
        buildcmd:     "",
        lintcmd:      "",
        testcmd:      ""
    },
    {
        templatename: "[Database] Supabase Jan2026",
        templatepath: "supabase",
        type:         "database",
        installcmd:   "docker compose up -d",
        startcmd:     "docker compose up -d",
        stopcmd:      "docker compose down",
        buildcmd:     "",
        lintcmd:      "",
        testcmd:      ""
    },
    {
        templatename: "[AWS] Localstack Jan2026",
        templatepath: "aws",
        type:         "aws",
        installcmd:   "docker compose up -d",
        startcmd:     "docker compose up -d",
        stopcmd:      "docker compose down",
        buildcmd:     "",
        lintcmd:      "",
        testcmd:      ""
    }
];

module.exports = repotemplate;