//@ts-nocheck

//These values are temporary, this tells how they are used
const config = {
    dev: {
        primaryServer:   "http://localhost:3000",
        primaryClient:   "http://localhost:5173",
        primaryApi:      "http://localhost:3000/api",
        primaryDatabase: "http://localhost:3000/api",
        secrets: {
            jwt:     process.env.JWT_SECRET || "dev_secret",
            anonKey: process.env.ANON_KEY   || "dev_anon",
            dbUrl:   process.env.DATABASE_URL || "file:./dev.db"
        }
    },
    prod: {
        primaryServer:   "https://api.myapp.com",
        primaryClient:   "https://myapp.com",
        primaryApi:      "https://api.myapp.com/api",
        primaryDatabase: "https://api.myapp.com/api",
        secrets: {
            jwt:     process.env.JWT_SECRET,
            anonKey: process.env.ANON_KEY,
            dbUrl:   process.env.DATABASE_URL
        }
    },
}   

export default config;