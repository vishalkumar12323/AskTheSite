import { Server as SocketIOServer } from "socket.io";
import { Redis } from "ioredis";
import { env } from "./config/env.js";
import http from "http"


// Single shared Redis subscriber for all socket connections.
// Unlike the regular redisConnection (used for BullMQ), a Redis client in
// subscriber mode can ONLY run subscribe/unsubscribe commands, so we need
// a dedicated instance.
const subscriber = new Redis(env.REDIS_URL);

// Track which taskIds have active listeners so we can unsubscribe when
// the last socket leaves the room.
const activeSubscriptions = new Set<string>();

export function setupSocketServer(httpServer: http.Server) {
    const io = new SocketIOServer(httpServer, {
        cors: { origin: "*" },
    });

    // Listen for ALL messages on the shared subscriber and route them
    // to the correct Socket.IO room.
    subscriber.on("message", (channel, message) => {
        const data = JSON.parse(message);
        console.log(`[Redis PubSub] ${channel}:`, data);
        // channel is "task:<taskId>", which matches the room name
        io.to(channel).emit("task:update", data);

        // If terminal state, clean up the subscription
        if (data.status === "COMPLETED" || data.status === "FAILED") {
            subscriber.unsubscribe(channel);
            activeSubscriptions.delete(channel);
        }
    });

    subscriber.on("ready", () => {
        console.log("✅ Redis PubSub subscriber connected and ready.");
    });

    io.on("connection", (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        socket.on("subscribe", async (taskId: string) => {
            const channel = `task:${taskId}`;
            socket.join(channel);
            console.log(`[Socket.IO] ${socket.id} joined room ${channel}`);

            // Only subscribe to Redis if no one is already listening on this channel
            if (!activeSubscriptions.has(channel)) {
                activeSubscriptions.add(channel);
                await subscriber.subscribe(channel);
                console.log(`[Redis PubSub] Subscribed to ${channel}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
            // Socket.IO automatically removes the socket from all rooms on disconnect.
            // We could clean up Redis subscriptions here, but it's safer to let the
            // terminal-state handler above do it, since another client might still
            // be watching the same task.
        });
    });

    return io;
}