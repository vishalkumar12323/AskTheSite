import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type TStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface TaskUpdate {
    status: TStatus;
    stage?: string;
    progress?: number;
    error?: string;
}

export const useSocket = (taskId: string) => {
    const socketRef = useRef<Socket | null>(null);
    const [update, setUpdate] = useState<TaskUpdate | null>(null);

    useEffect(() => {
        if (!taskId) return;

        const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
            transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("subscribe", taskId);
        });

        socket.on("task:update", (data: TaskUpdate) => {
            console.log("DATA:: ", data);
            setUpdate(data);
        });

        return () => {
            socket.disconnect();
        }
    }, [taskId]);

    return { update };
}