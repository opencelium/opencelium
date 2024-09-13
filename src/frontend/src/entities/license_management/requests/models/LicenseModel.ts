import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";

export default interface LicenseModel {
    _id: string,
    name: string,
    key: string,
}
export enum ActivationRequestStatus {
    PENDING= 'PENDING',
    PROCESSED= 'PROCESSED',
    EXPIRED= 'EXPIRED'
}

export interface LicenseListItem {
    _id: string,
    subscriptionType: string,
}
