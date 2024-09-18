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
    title: string,
    number: number,
}

export interface OperationUsageDetailModel {
    id: number,
    datetime: number,
    number: number,
}
