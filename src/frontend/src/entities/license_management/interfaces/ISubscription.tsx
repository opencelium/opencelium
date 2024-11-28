import {
    OperationUsageDetailModel,
    OperationUsageEntryModel
} from "@entity/license_management/requests/models/SubscriptionModel";

export type OperationUsageEntryProps = keyof OperationUsageEntryModel | string;
export type OperationUsageDetailProps = keyof OperationUsageDetailModel | string;
