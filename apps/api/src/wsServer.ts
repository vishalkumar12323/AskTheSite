import { Server as SocketIOServer } from "socket.io";
import { Redis } from "ioredis";
import { env } from "./config/env.js";
import http from "http"


export function setupSocketServer(httpServer: http.Server) {
    const io = new SocketIOServer(httpServer, {
        cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
        socket.on("subscribe", (taskId: string) => {
            socket.join(`task:${taskId}`);


            const subscriber = new Redis(env.REDIS_URL);
            subscriber.subscribe(`task:${taskId}`)

            subscriber.on("message", (_channel, message) => {
                const data = JSON.parse(message);
                io.to(`task:${taskId}`).emit("task:update", data);


                if (data.status === "COMPLETED" || data.status === "FAILED") {
                    subscriber.unsubscribe();
                    subscriber.quit();
                }
            });

            socket.on("disconnect", () => {
                subscriber.unsubscribe();
                subscriber.quit();
            })
        })
    });

    return io;
}