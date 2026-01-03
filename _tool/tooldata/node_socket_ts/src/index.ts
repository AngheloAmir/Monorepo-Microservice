import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket Logic
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('request-time', () => {
        const time = new Date().toLocaleTimeString();
        socket.emit('time-response', { time });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
