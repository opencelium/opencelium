import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export const useSupportFilesSocket = (socket: Socket | null) => {
    const [supportFiles, setSupportFiles] = useState<any[]>([]);

    useEffect(() => {
        if (!socket) return;
        const handleLog = (logs: any) => setSupportFiles(logs);
        socket.on("support-files", handleLog);
        return () => {
            socket.off("support-files", handleLog);
        };
    }, [socket]);

    return { supportFiles };
};
