import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { TaskUpdate } from "@/lib/task.types";

export const useConversationSocket = (conversationId: string | null) => {
    const socketRef = useRef<Socket | null>(null);
    const [update, setUpdate] = useState<TaskUpdate | null>(null);

    useEffect(() => {
        if (!conversationId) return;

        const socket = io(process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL!.replace("/api", ""), {
            transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("subscribe:conversation", conversationId);
        });

        socket.on("task:update", (data: TaskUpdate) => {
            console.log("[ConversationSocket] update:", data);
            setUpdate(data);
        });

        return () => {
            socket.disconnect();
        };
    }, [conversationId]);

    // Allow subscribing to specific task updates
    const subscribeTask = (taskId: string) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit("subscribe", taskId);
        }
    };

    const clearUpdate = () => setUpdate(null);

    return { update, subscribeTask, clearUpdate };
};
