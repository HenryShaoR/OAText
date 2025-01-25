import process from "process";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import { app } from "./server.js";

// Set up web app
const HOST = process.env.IP || "127.0.0.1";
const PORT = parseInt(process.env.PORT || "8800");

// Create HTTP server
const server = createServer(app);
// Add WebSocket server
const wss = new WebSocketServer({ server });
export const clients = new Map(); // Map to track active users

wss.on("connection", (ws) => {
    console.log("New WebSocket connection!");

    ws.on("message", (data) => {
        const message = JSON.parse(data);
        switch (message.type) {
            case "register":
                // Track the user ID and WebSocket connection
                clients.set(message.id, ws);
                console.log(`User ${message.id} registered as active.`);
                break;
            case "sendMessage":
                const { recipientId, text } = message;
                const recipientWs = clients.get(recipientId);
                if (recipientWs) {
                    recipientWs.send(JSON.stringify({ from: message.userId, text }));
                }
                break;
            default:
                console.log("Unknown message type:", message.type);
        }
    });

    ws.on("close", () => {
        // Remove disconnected users
        for (const [userId, connection] of clients.entries()) {
            if (connection === ws) {
                clients.delete(userId);
                console.log(`User ${userId} disconnected.`);
            }
        }
    });
});

// start server
server.listen(PORT, HOST, () => {
    console.log(`⚡️ Server started at ${HOST}:${PORT}`);
});