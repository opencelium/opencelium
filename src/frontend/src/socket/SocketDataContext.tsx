import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import { useSocket } from "./SocketContext";
import { useCurrentSchedulesSocket } from "./modules/useCurrentSchedulesSocket";
import {SocketDataContextType} from "./interfaces";
import {useSupportFilesSocket} from "./modules/useSupportFilesSocket";
import {useCurrentSubscriptionSocket} from "./modules/useCurrentSubscriptionSocket";
import {useAppDispatch} from "@application/utils/store";
import {Auth} from "@application/classes/Auth";
import {notifyAboutNewSupportFile} from "@root/redux_toolkit/slices/SupportFileSlice";
import {setIsAboutToLogout} from "@application/redux_toolkit/slices/AuthSlice";
import {TRIPLET_STATE} from "@application/interfaces/IApplication";
import {disableSocket} from "./socket";

const SocketDataContext = createContext<SocketDataContextType | undefined>(undefined);

export const SocketDataProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const {socket, resetSocket} = useSocket();
    const dispatch = useAppDispatch();
    const {authUser, isAboutToLogout} = Auth.getReduxState();
    const [isConnected, setIsConnected] = useState(false);
    const [authValid, setAuthValid] = useState(true);

    const { currentSchedules, setCurrentSchedules,  } = useCurrentSchedulesSocket(socket);
    const { hasNewSupportFile, setHasNewSupportFile } = useSupportFilesSocket(socket);
    const { currentSubscription } = useCurrentSubscriptionSocket(socket);
    const userSessionSubscriptionRef = useRef<() => void>();

    const isConnectedReference: any = useRef();
    isConnectedReference.current = isConnected;
    useEffect(() => {
        return () => {
            if (socket && socket.connected) {
                userSessionSubscriptionRef.current?.();
                socket.deactivate();
            }
        };
    }, []);

    useEffect(() => {
        if (authUser?.token) {
            if (!authValid) {
                setAuthValid(true);
            }
        } else {
            if (authValid) {
                setAuthValid(false);
            }
        }
    }, [authUser?.token]);
    const connect = () => {
        console.log('connect socket')
        console.log(socket);
        if (!socket) return;
        const alreadyConnected = socket.connected;

        socket.onConnect = () => {
            setIsConnected(true);
            const userSessionSubscription = socket.subscribe(`/user/session`, (message) => {
                const data = JSON.parse(message.body)
                console.log('/user/session', data);
                if (data.event === 'FORCE_LOGOUT') {
                    socket.deactivate().then(() => {
                        console.log("🧹 Deactivated");
                        dispatch(setIsAboutToLogout(TRIPLET_STATE.TRUE));
                        setCurrentSchedules([]);
                        disableSocket();
                    });
                }
            });
            console.log("✅ Subscribed to /user/session");
            userSessionSubscriptionRef.current = () => {
                userSessionSubscription.unsubscribe();
                userSessionSubscriptionRef.current = undefined;
                console.log("🧹 Unsubscribed from /user/session");
            };
        };
        socket.onDisconnect = () => {
            setIsConnected(false);
        };

        if (!alreadyConnected) {
            socket.activate();
        }
    }
    useEffect(() => {
        if (!authUser?.token) return;
        connect();
    }, [authUser?.token, socket]);
    useEffect(() => {
        switch(isAboutToLogout) {
            case TRIPLET_STATE.TRUE:
                break;
            case TRIPLET_STATE.FALSE:
                resetSocket();
                connect();
                break;
        }
    }, [isAboutToLogout])
    useEffect(() => {
        if (hasNewSupportFile) {
            dispatch(notifyAboutNewSupportFile())
            setHasNewSupportFile(false);
        }
    }, [hasNewSupportFile])
    return (
        <SocketDataContext.Provider
            value={{
                isConnected,
                authValid,
                currentSchedules,
                hasNewSupportFile,
                currentSubscription,
                socket,
            }}
        >
            {children}
        </SocketDataContext.Provider>
    );
};

export const useSocketData = () => useContext(SocketDataContext);
