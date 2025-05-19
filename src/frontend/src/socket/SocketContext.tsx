import React, {createContext, useContext, useRef} from "react";
import { getSocket } from "./socket";
import {Client} from "@stomp/stompjs";

const SocketContext = createContext<Client | null>(null);

export const SocketProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const socketRef = useRef<Client | null>(null);

    if (!socketRef.current) {
        socketRef.current = getSocket(); // <-- создаётся один раз навсегда
    }

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
