import {useEffect, useRef, useState} from "react";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {Client} from "@stomp/stompjs";
import {SocketAppPrefix} from "../socket";
import {Auth} from "@application/classes/Auth";
import {consoleLog} from "@application/utils/utils";

export const useCurrentSchedulesSocket = (socket: Client | null) => {
    const {isAboutToLogout} = Auth.getReduxState();
    const [currentSchedules, setCurrentSchedules] = useState<ModelCurrentSchedule[]>([]);
    const subscriptionRef = useRef<() => void>();
    const setSubscription = () => {
        if (subscriptionRef.current) {
            return;
        }
        if (!socket || !socket.connected) return;
        const subscription = socket.subscribe(`/scheduler/running/all`, (message) => {
            const data = JSON.parse(message.body) as ModelCurrentSchedule[];
            consoleLog('Socket.CurrentSchedules', data);
            setCurrentSchedules(data);
        });
        consoleLog("✅ Subscribed to /scheduler/running/all");
        subscriptionRef.current = () => {
            subscription.unsubscribe();
            subscriptionRef.current = undefined;
            consoleLog("🧹 Unsubscribed from /scheduler/running/all");
        };
    }
    useEffect(() => {
        setSubscription()
        return () => {
            subscriptionRef.current?.();
        };
    }, [socket?.connected]);
    useEffect(() => {
        if (isAboutToLogout){
            subscriptionRef.current?.();
        } else {
            setSubscription()
        }
    }, [isAboutToLogout]);

    return { currentSchedules, setCurrentSchedules };
};
