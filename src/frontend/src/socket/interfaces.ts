import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";

export interface SocketDataContextType {
    isConnected: boolean;
    authValid: boolean;
    currentSchedules: ModelCurrentSchedule[];
    connectionLogs: any[];
    supportFiles: any[],
    currentSubscription: SubscriptionModel,
}
