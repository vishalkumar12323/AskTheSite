import { Server as SocketIOServer } from "socket.io";
import { Redis } from "ioredis";
import { env } from "./config/env.js";
import { getTaskService } from "./services/task.services.js";
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

        // Also emit to the conversation room if provided
        if (data.conversationId) {
            io.to(`conversation:${data.conversationId}`).emit("task:update", data);
        }

        // If terminal state, clean up the subscription
        if (data.status === "COMPLETED" || data.status === "FAILED") {
            subscriber.unsubscribe(channel);
            activeSubscriptions.delete(channel);
        }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        socket.on("subscribe", async (taskId: string) => {
            const channel = `task:${taskId}`;
            socket.join(channel);

            // Only subscribe to Redis if no one is already listening on this channel
            if (!activeSubscriptions.has(channel)) {
                activeSubscriptions.add(channel);
                await subscriber.subscribe(channel);
            }

            // ---- CATCH-UP: Check the current DB state ----
            // If the worker already finished before we subscribed, the client
            // would never get an update (Redis Pub/Sub doesn't buffer).
            // So we check the DB and emit the current status immediately.
            try {
                const task = await getTaskService(taskId);
                if (task) {
                    socket.emit("task:update", {
                        status: task.status,
                        taskId: taskId,
                        stage: task.status === "COMPLETED" ? "DONE"
                            : task.status === "FAILED" ? "ERROR"
                                : "SYNCING",
                        progress: task.status === "COMPLETED" ? 100
                            : task.status === "FAILED" ? 0
                                : 10,
                        // Include answer data if completed
                        ...(task.status === "COMPLETED" && task.answer ? {
                            answer: task.answer.aiAnswer,
                        } : {}),
                    });
                }
            } catch (err) {
                console.error(`[Socket.IO] Failed to fetch catch-up status for ${taskId}:`, err);
            }
        });

        // Allow subscribing to conversation-level updates
        socket.on("subscribe:conversation", (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`[Socket.IO] ${socket.id} joined conversation:${conversationId}`);
        });

        socket.on("disconnect", () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });

    return io;
}