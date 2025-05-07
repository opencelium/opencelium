import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import { useSocket } from "./SocketContext";
import { useCurrentSchedulesSocket } from "./modules/useCurrentSchedulesSocket";
import { useConnectionLogsSocket } from "./modules/useConnectionLogsSocket";
import {SocketDataContextType} from "./interfaces";
import {useSupportFilesSocket} from "./modules/useSupportFilesSocket";
import {useCurrentSubscriptionSocket} from "./modules/useCurrentSubscriptionSocket";
import {useAppDispatch} from "@application/utils/store";
import {Auth} from "@application/classes/Auth";
import {addNotification} from "@application/redux_toolkit/slices/ApplicationSlice";
import {NotificationType} from "@application/interfaces/INotification";

const SocketDataContext = createContext<SocketDataContextType | undefined>(undefined);

export const SocketDataProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const socket = useSocket();
    const dispatch = useAppDispatch();
    const {authUser} = Auth.getReduxState();
    const [isConnected, setIsConnected] = useState(false);
    const [authValid, setAuthValid] = useState(true);

    const { currentSchedules } = useCurrentSchedulesSocket(socket);
    const { connectionLog } = useConnectionLogsSocket(socket);
    const { hasNewSupportFile, setHasNewSupportFile } = useSupportFilesSocket(socket);
    const { currentSubscription } = useCurrentSubscriptionSocket(socket);

    const isConnectedReference: any = useRef();
    isConnectedReference.current = isConnected;
    useEffect(() => {
        return () => {
            if (socket && socket.connected) {
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
            const date = new Date();
            dispatch(addNotification({
                id: date.getTime(),
                type: NotificationType.SUCCESS,
                title: 'OC',
                actionType: '',
                createdTime: date.getTime().toString(),
                params: {message: 'The new support file was generated.'}
            }))
            setHasNewSupportFile(false);
        }
    }, [hasNewSupportFile])

    return (
        <SocketDataContext.Provider
            value={{
                isConnected: isConnectedReference,
                authValid,
                currentSchedules,
                connectionLog,
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
