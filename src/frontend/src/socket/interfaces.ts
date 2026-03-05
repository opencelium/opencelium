import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {Client} from "@stomp/stompjs";
import {Metrics} from "@entity/dashboard/requests/interfaces/IWidget";

export interface SocketDataContextType {
    isConnected: any;
    authValid: boolean;
    systemMetrics: Metrics;
    currentSchedules: ModelCurrentSchedule[];
    hasNewSupportFile: boolean,
    currentSubscription: SubscriptionModel,
    socket: Client,
    deactivateSocket: () => Promise<void>,
}
