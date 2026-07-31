import { http, HttpResponse } from 'msw'
import type {
    ActiveSubscription,
    OperationUsageDetailRow,
    OperationUsageRow,
} from '@entities/subscription/model/types'

const periodStart = 1777593600000
const periodEnd = 1780271999999

const activeSubscription: ActiveSubscription = {
    subId: '674ee90a6280f0590b9e7b6b',
    licenseId: '674ee90a6280f0590b9e7b6e',
    type: 'free',
    startDate: 1640995200000,
    endDate: 0,
    duration: '-',
    totalOperationUsage: 25000,
    currentOperationUsage: 9633,
    active: true,
    monthPeriod: {
        startDate: periodStart,
        endDate: periodEnd,
    },
    extraOps: null,
}

const operationUsage: OperationUsageRow[] = [
    {
        id: 1,
        licenseId: '66e981a1061e985b595b7508',
        subId: '2b42193c-e6d2-44f1-ab28-3a442f435215',
        connectionTitle: 'fake',
        totalUsage: 35146,
        createdAt: 1778605296000,
        modifiedAt: 1778605296000,
        fromConnector: 'fake_api',
        toConnector: 'fake_api',
    },
]

const detailsByOperationId: Record<number, OperationUsageDetailRow[]> = {
    1: Array.from({ length: 39 }).map((_, idx) => ({
        id: 39 - idx,
        startDate: 1778681160000 - idx * 60_000 * 17,
        operationUsage: 507,
    })),
}

const paginate = <T,>(items: T[], page: number, size: number) => {
    const safeSize = size > 0 ? size : items.length || 1
    const totalItems = items.length
    const totalPages = Math.max(1, Math.ceil(totalItems / safeSize))
    const safePage = Math.max(0, Math.min(page, totalPages - 1))
    const content = items.slice(safePage * safeSize, safePage * safeSize + safeSize)
    return {
        content,
        currentPage: safePage,
        totalPages,
        totalItems,
    }
}

export const subscriptionHandlers = [
    http.get('/subs/active', () => HttpResponse.json(activeSubscription)),

    http.get('/subs/operation/usage', ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? 0)
        const size = Number(url.searchParams.get('size') ?? 5)
        return HttpResponse.json(paginate(operationUsage, page, size))
    }),

    http.get('/subs/operation/usage/:id/details', ({ params, request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? 0)
        const size = Number(url.searchParams.get('size') ?? 5)
        const id = Number(params.id)
        const rows = detailsByOperationId[id] ?? []
        return HttpResponse.json(paginate(rows, page, size))
    }),
]
