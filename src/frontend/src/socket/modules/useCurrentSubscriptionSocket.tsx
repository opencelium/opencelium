import {useEffect, useRef, useState} from "react";
import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";
import Subscription from "@entity/license_management/classes/Subscription";
import {Client} from "@stomp/stompjs";
import {Auth} from "@application/classes/Auth";
import {consoleLog} from "@application/utils/utils";

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
            consoleLog("📩 Socket.CurrentSubscription", data);
            setCurrentSubscription(data);
        });
        consoleLog("✅ Subscribed to /subscription");
        subscriptionRef.current = () => {
            subscription.unsubscribe();
            subscriptionRef.current = undefined;
            consoleLog("🧹 Unsubscribed from /subscription");
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
