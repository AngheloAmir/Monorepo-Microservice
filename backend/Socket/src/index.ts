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

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Random sentences
const sentences = [
    "Hello world!",
    "How are you doing?",
    "Socket.IO is cool!",
    "The weather is nice today.",
    "Keep coding!",
    "Have a great day.",
    "Servers never sleep.",
    "Connection stable."
];

// Socket Logic
io.on('connection', (socket) => {
    // -------------------------------------------------------------------------
    //  THIS SCOPE BELONGS TO ONE SINGLE USER
    //  'socket' = The specific client who just connected.
    //  Any variable declared here is private to this user's session.
    // -------------------------------------------------------------------------
    console.log(`New Client Connected. ID: ${socket.id}`);
    
    // We can store data on this specific user's socket object
    socket.data = { username: "Guest" }; 

    let chatInterval: NodeJS.Timeout | null = null;

    // --- Main Page Events ---
    socket.on('request-time', () => {
        // This only sends time back to THIS specific user
        const time = new Date().toLocaleTimeString();
        socket.emit('time-response', { time });
    });

    // --- Chat Page Events ---
    socket.on('join-chat', (username) => {
        // Now we "own" this username for this connection
        socket.data.username = username;
        console.log(`User ${socket.data.username} joined chat on ${socket.id}`);

        // Start sending random messages ONLY to this user
        if(chatInterval) clearInterval(chatInterval);
        
        chatInterval = setInterval(() => {
            const randomMsg = sentences[Math.floor(Math.random() * sentences.length)];
            socket.emit('server-message', { text: randomMsg });
        }, 3000);
    });

    socket.on('chat-message', (msg) => {
        const user = socket.data.username;
        console.log(`[${user}] sent: ${msg}`);

        // Reply automatically to THIS user
        const reply = `I received your "${msg}"`;
        setTimeout(() => {
            socket.emit('server-message', { text: reply });
        }, 500);
    });

    socket.on('disconnect', () => {
        if(chatInterval) clearInterval(chatInterval);
        console.log(`Client ${socket.data.username} disconnected: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
