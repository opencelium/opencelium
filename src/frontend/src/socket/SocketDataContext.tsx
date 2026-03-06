import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import { useSocket } from "./SocketContext";
import { useCurrentSchedulesSocket } from "./modules/useCurrentSchedulesSocket";
import {SocketDataContextType} from "./interfaces";
import {useSupportFilesSocket} from "./modules/useSupportFilesSocket";
import {useCurrentSubscriptionSocket} from "./modules/useCurrentSubscriptionSocket";
import {useAppDispatch} from "@application/utils/store";
import {Auth} from "@application/classes/Auth";
import {notifyAboutNewSupportFile} from "@root/redux_toolkit/slices/SupportFileSlice";
import {setIsAboutToLogout, updateAuthUser} from "@application/redux_toolkit/slices/AuthSlice";
import {TRIPLET_STATE} from "@application/interfaces/IApplication";
import IAuthUser from "@entity/user/interfaces/IAuthUser";
import {LocalStorage} from "@application/classes/LocalStorage";
import {consoleLog} from "@application/utils/utils";
import {useSystemMetricsSocket} from "./modules/useSystemMetricsSocket";

const SocketDataContext = createContext<SocketDataContextType | undefined>(undefined);

export const SocketDataProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const {socket, setSocket, resetSocket, deactivateSocket} = useSocket();
    const dispatch = useAppDispatch();
    const {authUser, isAboutToLogout} = Auth.getReduxState();
    const [isConnected, setIsConnected] = useState(false);
    const [socketError, setSocketError] = useState<string | null>(null);
    const [authValid, setAuthValid] = useState(true);

    const { currentSchedules, setCurrentSchedules,  } = useCurrentSchedulesSocket(socket);
    const { hasNewSupportFile, setHasNewSupportFile } = useSupportFilesSocket(socket);
    const { currentSubscription } = useCurrentSubscriptionSocket(socket);
    const { systemMetrics, setSystemMetrics,  } = useSystemMetricsSocket(socket);
    const userSessionSubscriptionRef = useRef<() => void>();

    const isConnectedReference: any = useRef();
    isConnectedReference.current = isConnected;

    const sessionChannel = useRef<BroadcastChannel>();

    useEffect(() => {
        sessionChannel.current = new BroadcastChannel('session-events');

        sessionChannel.current.onmessage = (event) => {
            if (event.data.type === 'SESSION_UPDATE') {
                if (event.data.payload.action === 'RELOGIN') {
                    consoleLog('📣 Received RELOGIN from another tab');

                    const storage = LocalStorage.getStorage(true);
                    const authUser: IAuthUser = storage.get('authUser');
                    dispatch(updateAuthUser(authUser))
                    connect();
                }
            }
        };

        return () => {
            sessionChannel.current?.close();
        };
    }, []);

    useEffect(() => {
        return () => {
            deactivateSocket().catch()
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
        if (!socket || isConnected) return;
        const alreadyConnected = socket.connected;

        socket.onConnect = () => {
            setIsConnected(true);
            setSocketError(null);
            const userSessionSubscription = socket.subscribe(`/user/session`, async (message) => {
                const data = JSON.parse(message.body)
                consoleLog('/user/session', data);
                if (data.event === 'FORCE_LOGOUT') {
                    await deactivateSocket();
                    consoleLog("🧹 Deactivated");
                    dispatch(setIsAboutToLogout(TRIPLET_STATE.TRUE));
                    setCurrentSchedules([]);
                    setSystemMetrics(undefined)
                }
            });
            consoleLog("✅ Subscribed to /user/session");
            userSessionSubscriptionRef.current = () => {
                userSessionSubscription.unsubscribe();
                userSessionSubscriptionRef.current = undefined;
                consoleLog("🧹 Unsubscribed from /user/session");
            };
        };
        socket.onDisconnect = () => {
            consoleLog('Socket disconnected')
            setIsConnected(false);
        };

        socket.onStompError = (frame) => {
            console.error('[STOMP ERROR]', frame.headers['message'], frame.body);

            setSocketError(frame.headers['message'] || 'STOMP error');
            setIsConnected(false);
        };

        socket.onWebSocketError = (event) => {
            console.error('[WS ERROR]', event);

            setSocketError('WebSocket connection error');
            setIsConnected(false);
        };
        if (!alreadyConnected) {
            setSocketError(null);
            socket.activate();
        }
    }
    useEffect(() => {
        if (!authUser?.token) return;
        setSocket();
    }, [authUser?.token]);
    useEffect(() => {
        connect();
    }, [socket]);
    useEffect(() => {
        switch(isAboutToLogout) {
            case TRIPLET_STATE.TRUE:
                break;
            case TRIPLET_STATE.FALSE:
                sessionChannel.current?.postMessage({
                    type: 'SESSION_UPDATE',
                    payload: { action: 'RELOGIN' }
                });
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
                systemMetrics,
                hasNewSupportFile,
                currentSubscription,
                socket,
                deactivateSocket,
                socketError,
            }}
        >
            {children}
        </SocketDataContext.Provider>
    );
};

export const useSocketData = () => useContext(SocketDataContext);
