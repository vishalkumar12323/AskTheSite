import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { TaskUpdate } from "@/lib/task.types";

export const useConversationSocket = (conversationId: string | null) => {
    const socketRef = useRef<Socket | null>(null);
    const [update, setUpdate] = useState<TaskUpdate | null>(null);
    // Queue a pending task subscription if subscribeTask is called before the socket connects
    const pendingTaskIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!conversationId) return;

        const wsUrl =
            process.env.NEXT_PUBLIC_WS_URL ||
            process.env.NEXT_PUBLIC_API_URL!.replace("/api", "");

        const socket = io(wsUrl, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[ConversationSocket] connected:", socket.id);
            socket.emit("subscribe:conversation", conversationId);

            // Flush any pending task subscription that arrived before connection
            if (pendingTaskIdRef.current) {
                console.log("[ConversationSocket] flushing pending task subscription:", pendingTaskIdRef.current);
                socket.emit("subscribe", pendingTaskIdRef.current);
                pendingTaskIdRef.current = null;
            }
        });

        socket.on("disconnect", (reason) => {
            console.log("[ConversationSocket] disconnected:", reason);
        });

        socket.on("connect_error", (err) => {
            console.error("[ConversationSocket] connection error:", err.message);
        });

        socket.on("task:update", (data: TaskUpdate) => {
            console.log("[ConversationSocket] task:update:", data);
            setUpdate(data);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [conversationId]);

    /**
     * Subscribe to a specific task's updates.
     * If the socket isn't connected yet, the subscription is queued and
     * automatically emitted once the connection is established.
     */
    const subscribeTask = useCallback((taskId: string) => {
        if (socketRef.current?.connected) {
            console.log("[ConversationSocket] subscribing to task:", taskId);
            socketRef.current.emit("subscribe", taskId);
        } else {
            // Socket not ready yet — queue the subscription for the connect handler
            console.log("[ConversationSocket] socket not ready, queuing task subscription:", taskId);
            pendingTaskIdRef.current = taskId;
        }
    }, []);

    const clearUpdate = useCallback(() => setUpdate(null), []);

    return { update, subscribeTask, clearUpdate };
};
