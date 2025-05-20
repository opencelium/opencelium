import React, {createContext, useContext, useRef} from "react";
import { getSocket } from "./socket";
import {Client} from "@stomp/stompjs";

const SocketContext = createContext<{socket: Client | null, resetSocket: () => void,}>({socket: null, resetSocket: () => {}});

export const SocketProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const socketRef = useRef<Client | null>(null);

    if (!socketRef.current) {
        socketRef.current = getSocket();
    }

    const resetSocket = () => {
        console.log('reset socket')
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.deactivate().then(() => {
                socketRef.current = getSocket();
            });
        } else {
            socketRef.current = getSocket();
        }
    }

    return (
        <SocketContext.Provider value={{socket: socketRef.current, resetSocket}}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
