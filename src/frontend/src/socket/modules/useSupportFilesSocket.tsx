import {useEffect, useRef, useState} from "react";
import { Socket } from "socket.io-client";
import {Client} from "@stomp/stompjs";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {SocketAppPrefix} from "../socket";
import {Auth} from "@application/classes/Auth";

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
            console.log('Socket.SupportFiles', data);
            setHasNewSupportFile(true);
        });
        console.log("✅ Subscribed to /execution/support-file");
        subscriptionRef.current = () => {
            subscription.unsubscribe();
            subscriptionRef.current = undefined;
            console.log("🧹 Unsubscribed from /execution/support-file");
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
