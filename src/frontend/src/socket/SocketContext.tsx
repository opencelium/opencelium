import React, {createContext, useContext, useEffect, useMemo} from "react";
import { getSocket } from "./socket";
import {mockSocket} from "./MockOpenceliumSocket";
import {Auth} from "@application/classes/Auth";
import {Client} from "@stomp/stompjs";

const SocketContext = createContext(null);

export const SocketProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const {authUser} = Auth.getReduxState();
    const socket = useMemo(() => {
        if (authUser?.token) {
            return getSocket();
        }
        return null;
    }, [authUser]);
    //const socket = useMemo(() => mockSocket, []);
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext) as Client | null;;
