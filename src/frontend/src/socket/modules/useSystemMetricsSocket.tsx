import {useEffect, useRef, useState} from "react";
import {Client} from "@stomp/stompjs";
import {Auth} from "@application/classes/Auth";
import {consoleLog} from "@application/utils/utils";
import {Metrics} from "@entity/dashboard/requests/interfaces/IWidget";

export const useSystemMetricsSocket = (socket: Client | null) => {
    const {isAboutToLogout} = Auth.getReduxState();
    const [systemMetrics, setSystemMetrics] = useState<Metrics>();
    const subscriptionRef = useRef<() => void>();
    const setSubscription = () => {
        if (subscriptionRef.current) {
            return;
        }
        if (!socket || !socket.connected) return;
        const subscription = socket.subscribe(`/subscription/system/metrics`, (message) => {
            const data = JSON.parse(message.body) as Metrics;
            console.log(data);
            consoleLog('Socket.SystemMetrics', data);
            setSystemMetrics(data);
        });
        consoleLog("✅ Subscribed to /subscription/system/metrics");
        subscriptionRef.current = () => {
            subscription.unsubscribe();
            subscriptionRef.current = undefined;
            consoleLog("🧹 Unsubscribed from /subscription/system/metrics");
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

    return { systemMetrics, setSystemMetrics };
};
