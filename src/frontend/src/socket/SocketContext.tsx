import React, { createContext, useContext, useMemo } from "react";
import { getSocket } from "./socket";
import {mockSocket} from "./MockSocket";

const SocketContext = createContext(null);

export const SocketProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    //const socket = useMemo(() => getSocket(), []);
    const socket = useMemo(() => mockSocket, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
