import {useEffect, useRef, useState} from "react";
import { Socket } from "socket.io-client";
import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";
import Subscription from "@entity/license_management/classes/Subscription";
import {Client} from "@stomp/stompjs";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {SocketAppPrefix} from "../socket";

export const useCurrentSubscriptionSocket = (socket: Client | null) => {
    const {currentSubscription: reduxCurrentSubscription} = Subscription.getReduxState();
    const [currentSubscription, setCurrentSubscription] = useState<SubscriptionModel | undefined>(undefined);
    const subscriptionRef = useRef<() => void>();

    useEffect(() => {
        if (!socket || !socket.connected) return;
        if (subscriptionRef.current) {
            return;
        }
        const subscription = socket.subscribe("/subscription", (message) => {
            const data = JSON.parse(message.body) as SubscriptionModel;
            console.log("📩 Socket.CurrentSubscription", data);
            setCurrentSubscription(data);
        });
        console.log("✅ Subscribed to /subscription");
        subscriptionRef.current = () => {
            subscription.unsubscribe();
            subscriptionRef.current = undefined;
            console.log("🧹 Unsubscribed from /subscription");
        };
        return () => {
            subscriptionRef.current?.();
        };
    }, [socket?.connected]);

    useEffect(() => {
        setCurrentSubscription(reduxCurrentSubscription);
    }, [reduxCurrentSubscription]);
    return { currentSubscription };
};
