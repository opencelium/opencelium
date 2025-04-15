import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export const useConnectionLogsSocket = (socket: Socket | null) => {
    const [connectionLogs, setConnectionLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!socket) return;
        const handleLog = (log: any) => setConnectionLogs((prev) => [...prev, log]);
        socket.on("connection-logs", handleLog);
        return () => {
            socket.off("connection-logs", handleLog);
        };
    }, [socket]);

    return { connectionLogs };
};
