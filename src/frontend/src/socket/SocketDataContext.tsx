import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import { useCurrentSchedulesSocket } from "./modules/useCurrentSchedulesSocket";
import { useConnectionLogsSocket } from "./modules/useConnectionLogsSocket";
import {SocketDataContextType} from "./interfaces";
import {useSupportFilesSocket} from "./modules/useSupportFilesSocket";
import {useCurrentSubscriptionSocket} from "./modules/useCurrentSubscriptionSocket";
import {useAppDispatch} from "@application/utils/store";
import {getCurrentSubscription} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
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
    const { connectionLogs } = useConnectionLogsSocket(socket);
    const { hasNewSupportFile, setHasNewSupportFile } = useSupportFilesSocket(socket);
    const { currentSubscription } = useCurrentSubscriptionSocket(socket);

    const handleConnect = () => {
        setIsConnected(true);
    }
    const handleDisconnect = () => {
        setIsConnected(false);
    }
    useEffect(() => {
        dispatch(getCurrentSubscription());
    }, []);

    useEffect(() => {
        if (!socket.connected) {
            if (authUser) {
                socket.connect();
            }
        } else {
            if (!isConnected) {
                handleConnect();
            }
        }
    }, [authUser]);

    useEffect(() => {
        if (!socket) return;
        const handleAuth = (valid: boolean) => setAuthValid(valid);

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("auth-status", handleAuth);
        if (!socket.connected) {
            socket.connect();
        } else {
            handleConnect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("auth-status", handleAuth);
            socket.disconnect();
        };
    }, [socket]);

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
                isConnected,
                authValid,
                currentSchedules,
                connectionLogs,
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
