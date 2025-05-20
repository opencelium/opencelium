import {useEffect, useRef, useState} from "react";
import { Socket } from "socket.io-client";
import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";
import Subscription from "@entity/license_management/classes/Subscription";
import {Client} from "@stomp/stompjs";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {SocketAppPrefix} from "../socket";
import {Auth} from "@application/classes/Auth";

export const useCurrentSubscriptionSocket = (socket: Client | null) => {
    const {isAboutToLogout} = Auth.getReduxState();
    const {currentSubscription: reduxCurrentSubscription} = Subscription.getReduxState();
    const [currentSubscription, setCurrentSubscription] = useState<SubscriptionModel | undefined>(undefined);
    const subscriptionRef = useRef<() => void>();
    const setSubscription = () => {
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
    }
    useEffect(() => {
        setSubscription()
        return () => {
            subscriptionRef.current?.();
        };
    }, [socket?.connected]);

    useEffect(() => {
        if (isAboutToLogout) {
            subscriptionRef.current?.();
        } else {
            setSubscription()
        }
    }, [isAboutToLogout]);

    useEffect(() => {
        setCurrentSubscription(reduxCurrentSubscription);
    }, [reduxCurrentSubscription]);
    return { currentSubscription };
};
