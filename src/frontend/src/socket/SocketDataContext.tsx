import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import { useCurrentSchedulesSocket } from "./modules/useCurrentSchedulesSocket";
import { useConnectionLogsSocket } from "./modules/useConnectionLogsSocket";
import {SocketDataContextType} from "./interfaces";
import {useSupportFilesSocket} from "./modules/useSupportFilesSocket";
import {useCurrentSubscriptionSocket} from "./modules/useCurrentSubscriptionSocket";

const SocketDataContext = createContext<SocketDataContextType | undefined>(undefined);

export const SocketDataProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const socket = useSocket();
    const [isConnected, setIsConnected] = useState(false);
    const [authValid, setAuthValid] = useState(true);

    // Modular handlers
    const { currentSchedules } = useCurrentSchedulesSocket(socket);
    const { connectionLogs } = useConnectionLogsSocket(socket);
    const { supportFiles } = useSupportFilesSocket(socket);
    const { currentSubscription } = useCurrentSubscriptionSocket(socket);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleAuth = (valid: boolean) => setAuthValid(valid);

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("auth-status", handleAuth);

        socket.emit("get-initial-state");

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("auth-status", handleAuth);
        };
    }, [socket]);

    return (
        <SocketDataContext.Provider
            value={{
                isConnected,
                authValid,
                currentSchedules,
                connectionLogs,
                supportFiles,
                currentSubscription,
            }}
        >
            {children}
        </SocketDataContext.Provider>
    );
};

export const useSocketData = () => useContext(SocketDataContext);
