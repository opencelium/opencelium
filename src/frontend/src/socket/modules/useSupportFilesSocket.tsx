import {useEffect, useRef, useState} from "react";
import { Socket } from "socket.io-client";
import {Client} from "@stomp/stompjs";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {SocketAppPrefix} from "../socket";
import {Auth} from "@application/classes/Auth";
import {consoleLog} from "@application/utils/utils";

export const useSupportFilesSocket = (socket: Client | null) => {
    const {isAboutToLogout} = Auth.getReduxState();
    const [hasNewSupportFile, setHasNewSupportFile] = useState<boolean>(false);
    const subscriptionRef = useRef<() => void>();
    const setSubscription = () => {

        if (!socket || !socket.connected) return;
        if (subscriptionRef.current) {
            return;
        }
        const subscription = socket.subscribe(`/execution/support-file`, (message) => {
            const data = JSON.parse(message.body) as ModelCurrentSchedule[];
            consoleLog('Socket.SupportFiles', data);
            setHasNewSupportFile(true);
        });
        consoleLog("✅ Subscribed to /execution/support-file");
        subscriptionRef.current = () => {
            subscription.unsubscribe();
            subscriptionRef.current = undefined;
            consoleLog("🧹 Unsubscribed from /execution/support-file");
        };
    }
    useEffect(() => {
        setSubscription();
        return () => {
            subscriptionRef.current?.();
        };
    }, [socket?.connected]);
    useEffect(() => {
        if (isAboutToLogout) {
            subscriptionRef.current?.();
        } else {
            setSubscription();
        }
    }, [isAboutToLogout]);

    return { hasNewSupportFile, setHasNewSupportFile };
};
