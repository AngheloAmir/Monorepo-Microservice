import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import config from '@monorepo/config';
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

import authRoutes from './routes/test.route';
import cookieParser from 'cookie-parser';
import { isAllowedOutsideCookies, allowedOrigins } from './config/authConfig';


//CORS and allowing apps outside the server to access it
if (isAllowedOutsideCookies) {
    app.use(cors({
        origin: (origin, callback) => {
            // If no origin (like mobile apps or curl), allow it
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Refresh-Token'],
        credentials: true
    }));
}

app.use(express.json());
app.use(cookieParser());

//Define routes here========================================================
app.use('/', authRoutes);

// Serve static files from 'public' directory===============================
const localPublic  = path.join(__dirname, 'public');
const parentPublic = path.join(__dirname, '../public');
const publicDir    = require('fs').existsSync(localPublic) ? localPublic : parentPublic;

app.use(express.static(publicDir));

// Fallback for root to ensure index.html is served=========================
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
    console.log(`Node service listening at http://localhost:${port}`);
    console.log(`Visit http://localhost:${port}/test `)
    console.log(`Visit http://localhost:${port}/login `)
    console.log(`Visit http://localhost:${port}/auth `);
    console.log(config.test);
    console.log("Done")
});
