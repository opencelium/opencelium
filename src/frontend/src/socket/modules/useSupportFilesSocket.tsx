import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export const useSupportFilesSocket = (socket: Socket | null) => {
    const [hasNewSupportFile, setHasNewSupportFile] = useState<boolean>(false);
    useEffect(() => {
        if (!socket) return;
        const handleLog = () => {
            setHasNewSupportFile(true);
        }
        socket.on("support-files", handleLog);
        return () => {
            socket.off("support-files", handleLog);
        };
    }, [socket]);

    return { hasNewSupportFile, setHasNewSupportFile };
};
