import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";
import Subscription from "@entity/license_management/classes/Subscription";

export const useCurrentSubscriptionSocket = (socket: Socket | null) => {
    const {currentSubscription: reduxCurrentSubscription} = Subscription.getReduxState();
    const [currentSubscription, setCurrentSubscription] = useState<SubscriptionModel | undefined>(undefined);

    useEffect(() => {
        if (!socket) return;
        const handleSubscription = (sub: SubscriptionModel) => setCurrentSubscription(sub);
        socket.on("current-subscription", handleSubscription);
        return () => {
            socket.off("current-subscription", handleSubscription);
        };
    }, [socket]);


    useEffect(() => {
        setCurrentSubscription(reduxCurrentSubscription);
    }, [reduxCurrentSubscription]);
    return { currentSubscription };
};
