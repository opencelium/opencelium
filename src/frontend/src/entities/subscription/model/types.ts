export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | string

export type Subscription = {
    subscriptionId: number
    name: string
    status: SubscriptionStatus
    startDate: number
    endDate: number
    seats?: number
    seatsInUse?: number
}

export type ActiveSubscriptionMonthPeriod = {
    startDate: number
    endDate: number
}

export type ActiveSubscription = {
    subId: string
    licenseId: string
    type: string
    startDate: number
    endDate: number
    duration: string
    totalOperationUsage: number
    currentOperationUsage: number
    active: boolean
    monthPeriod: ActiveSubscriptionMonthPeriod
    extraOps: number | null
}

export type SyncStatus = {
    active: boolean
    invoker_sync: { active: boolean }
    template_sync: { active: boolean }
}

export type SubscriptionListItem = {
    _id: string
    subscriptionType: string
}

export type OperationUsageRow = {
    id: number
    licenseId: string
    subId: string
    connectionTitle: string
    totalUsage: number
    createdAt: number
    modifiedAt: number
    fromConnector: string
    toConnector: string
}

export type OperationUsageDetailRow = {
    id: number
    startDate: number
    operationUsage: number
}

export type PagedResponse<T> = {
    content: T[]
    currentPage: number
    totalPages: number
    totalItems: number
}

export type OperationUsageQuery = {
    page: number
    size: number
    startDate: number
    endDate: number
}

export type OperationUsageDetailsQuery = OperationUsageQuery & {
    id: number
    sort?: string
}
