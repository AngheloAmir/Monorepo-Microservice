//@ts-nocheck

//These values are temporary, this tells how they are used
const config = {
    dev: {
        primaryServer:   "http://localhost:3000",
        primaryClient:   "http://localhost:5173",
        primaryApi:      "http://localhost:3000/api",
        primaryDatabase: "http://localhost:3000/api",
    },
    prod: {
        primaryServer:   "http://localhost:3000",
        primaryClient:   "http://localhost:5173",
        primaryApi:      "http://localhost:3000/api",
        primaryDatabase: "http://localhost:3000/api",
    },

    secrets: {
        jwt:     process.env.JWT_SECRET || "secret",
        anonKey: process.env.ANON_KEY   || "secret",
    }
}   

export default config;