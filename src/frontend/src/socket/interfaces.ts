import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {Socket} from "socket.io-client";

export interface SocketDataContextType {
    isConnected: boolean;
    authValid: boolean;
    currentSchedules: ModelCurrentSchedule[];
    connectionLogs: any[];
    hasNewSupportFile: boolean,
    currentSubscription: SubscriptionModel,
    socket: Socket,
}
