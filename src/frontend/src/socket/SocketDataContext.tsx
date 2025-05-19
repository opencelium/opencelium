import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import { useSocket } from "./SocketContext";
import { useCurrentSchedulesSocket } from "./modules/useCurrentSchedulesSocket";
import {SocketDataContextType} from "./interfaces";
import {useSupportFilesSocket} from "./modules/useSupportFilesSocket";
import {useCurrentSubscriptionSocket} from "./modules/useCurrentSubscriptionSocket";
import {useAppDispatch} from "@application/utils/store";
import {Auth} from "@application/classes/Auth";
import {notifyAboutNewSupportFile} from "@root/redux_toolkit/slices/SupportFileSlice";

const SocketDataContext = createContext<SocketDataContextType | undefined>(undefined);

export const SocketDataProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const socket = useSocket();
    const dispatch = useAppDispatch();
    const {authUser} = Auth.getReduxState();
    const [isConnected, setIsConnected] = useState(false);
    const [authValid, setAuthValid] = useState(true);

    const { currentSchedules } = useCurrentSchedulesSocket(socket);
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

    useEffect(() => {
        if (!socket || !authUser?.token) return;

        const alreadyConnected = socket.connected;

        socket.onConnect = () => {
            setIsConnected(true);
            const userSessionSubscription = socket.subscribe(`/user/session`, (message) => {
                const data = JSON.parse(message.body)
                console.log('/user/session', data);
                if (data.event === 'FORCE_LOGOUT') {
                    socket.deactivate();
                    setIsConnected(false);
                }
            });
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
    }, [authUser?.token, socket]);
    useEffect(() => {
        if (hasNewSupportFile) {
            dispatch(notifyAboutNewSupportFile())
            setHasNewSupportFile(false);
        }
    }, [hasNewSupportFile])
    console.log(isConnected);
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
