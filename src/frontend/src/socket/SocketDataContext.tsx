import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import { useSocket } from "./SocketContext";
import { useCurrentSchedulesSocket } from "./modules/useCurrentSchedulesSocket";
import {SocketDataContextType} from "./interfaces";
import {useSupportFilesSocket} from "./modules/useSupportFilesSocket";
import {useCurrentSubscriptionSocket} from "./modules/useCurrentSubscriptionSocket";
import {useAppDispatch} from "@application/utils/store";
import {Auth} from "@application/classes/Auth";
import {addNotification} from "@application/redux_toolkit/slices/ApplicationSlice";
import {NotificationType} from "@application/interfaces/INotification";
import {notifyAboutNewSupportFile} from "@root/redux_toolkit/slices/SupportFileSlice";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";

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
                socket.deactivate().then(() => console.log("🧹 Socket deactivated"));
            }
        };
    }, []);
    useEffect(() => {
        console.log('isConnected', isConnected)
    }, [isConnected])

    useEffect(() => {
        if (authUser) {
            if (!authValid) {
                setAuthValid(true);
            }
        } else {
            if (authValid) {
                setAuthValid(false);
            }
        }
    }, [authUser]);

    useEffect(() => {
        if (socket && authUser && !socket.connected) {
            socket.onConnect = () => {
                console.log("STOMP connected");
                if (!isConnected){
                    setIsConnected(true);
                }
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
                console.log("STOMP disconnected");
                if (isConnected) {
                    setIsConnected(false);
                }
            };
            if (!socket.connected) {
                socket.activate();
            }
        }
    }, [authUser, socket]);
    useEffect(() => {
        if (hasNewSupportFile) {
            dispatch(notifyAboutNewSupportFile())
            setHasNewSupportFile(false);
        }
    }, [hasNewSupportFile])

    return (
        <SocketDataContext.Provider
            value={{
                isConnected: isConnectedReference.current,
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
