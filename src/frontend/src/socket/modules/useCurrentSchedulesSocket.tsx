import {useEffect, useRef, useState} from "react";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {Client} from "@stomp/stompjs";
import {SocketAppPrefix} from "../socket";

export const useCurrentSchedulesSocket = (socket: Client | null) => {
    const [currentSchedules, setCurrentSchedules] = useState<ModelCurrentSchedule[]>([]);
    const subscriptionRef = useRef<() => void>();

    useEffect(() => {
        if (subscriptionRef.current) {
            return;
        }
        if (!socket || !socket.connected) return;
        const subscription = socket.subscribe(`/scheduler/running/all`, (message) => {
            const data = JSON.parse(message.body) as ModelCurrentSchedule[];
            console.log('Socket.CurrentSchedules', data);
            setCurrentSchedules(data);
        });
        console.log("✅ Subscribed to /scheduler/running/all");
        subscriptionRef.current = () => {
            subscription.unsubscribe();
            subscriptionRef.current = undefined;
            console.log("🧹 Unsubscribed from /scheduler/running/all");
        };
        return () => {
            subscriptionRef.current?.();
        };
    }, [socket?.connected]);

    return { currentSchedules };
};
