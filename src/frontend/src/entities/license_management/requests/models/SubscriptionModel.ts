export default interface SubscriptionModel {
    _id: string,
    subId: string,
    type: string,
    startDate: number,
    duration: string,
    endDate: number,
    totalOperationUsage: number | null,
    currentOperationUsage?: number,
    active: boolean,
}

export interface OperationUsageEntryModel {
    id: number,
    licenseId: string,
    subId: string,
    connectionTitle: string,
    totalUsage: number,
}

export interface OperationUsageDetailModel {
    id: number,
    startDate: number,
    operationUsage: number,
}
