import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import {disableSocket, getSocket} from "./socket";
import {Client} from "@stomp/stompjs";
import {consoleLog} from "@application/utils/utils";

const SocketContext = createContext<{socket: Client | null, setSocket: () => void, resetSocket: () => void, deactivateSocket: () => Promise<void>}>({socket: null, setSocket: () => {}, resetSocket: () => {}, deactivateSocket: async () => {}});

export const SocketProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [socket, changeSocket] = useState<Client | null>(null);
    useEffect(() => {
        changeSocket(getSocket());
    }, []);

    const setSocket = () => {
        changeSocket(getSocket());
    }

    const resetSocket = async () => {
        await deactivateSocket();
        setSocket();
    }

    const deactivateSocket = async () => {
        await disableSocket();
        changeSocket(null);
    }

    return (
        <SocketContext.Provider value={{socket, setSocket, resetSocket, deactivateSocket}}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
