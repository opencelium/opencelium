export default interface SubscriptionModel {
    _id: string,
    type: string,
    startDate: number,
    duration: string,
    endDate: number,
    totalOperationUsage: number | null,
    currentOperationUsage?: number,
}
