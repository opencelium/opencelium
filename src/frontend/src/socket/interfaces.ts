import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {Socket} from "socket.io-client";
import {ConnectionSocketLog} from "@root/requests/models/ConnectionLog";
import {Client} from "@stomp/stompjs";

export interface SocketDataContextType {
    isConnected: boolean;
    authValid: boolean;
    currentSchedules: ModelCurrentSchedule[];
    hasNewSupportFile: boolean,
    currentSubscription: SubscriptionModel,
    socket: Client,
}
