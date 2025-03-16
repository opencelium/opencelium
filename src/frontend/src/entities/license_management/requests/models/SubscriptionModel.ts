export default interface SubscriptionModel {
    _id: string,
    subId: string,
    type: string,
    startDate: number,
    duration: string,
    endDate: number,
    totalOperationUsage: number | null,
    currentOperationUsage?: number,
    extraOps: ExtraOp[] | null,
    active: boolean,
    monthPeriod: {
        startDate: number,
        endDate: number,
    }
}
export enum ExtraOpStatus {
    Active= 'ACTIVE',
    Expired= 'EXPIRED',
    Consumed= 'CONSUMED',
    Pending= 'PENDING',
}
export interface ExtraOp {
    id: number,
    licenseId: string,
    totalOpsUsage: number,
    currentOpsUsage: number,
    generatedAt: number,
    activationDate: number,
    endDate: number,
    status: ExtraOpStatus,
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
