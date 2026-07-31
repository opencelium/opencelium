import { baseApi } from '@shared/api/baseApi'

export type DayOfWeek =
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY'

export type ExecutionsTimelinePoint = {
    // Serialized shape varies (ISO string vs. [y, m, d] array); axis labels use
    // dayOfWeek instead, so the raw date is kept untyped at the boundary.
    date: unknown
    dayOfWeek: DayOfWeek
    executions: number
    failures: number
}

export type ExecutionsTimelineDTO = {
    points: ExecutionsTimelinePoint[]
}

export type TopWorkflowRow = {
    connectionId: number
    title: string
    executions: number
    failureRate: number
}

export type TopWorkflowsDTO = {
    rows: TopWorkflowRow[]
}

export const dashboardWidgetApi = baseApi.injectEndpoints({
    endpoints: (b) => ({
        getExecutionsTimeline: b.query<ExecutionsTimelineDTO, { days?: number } | void>({
            query: (arg) => `/widget/executions-timeline?days=${arg?.days ?? 7}`,
        }),
        getTopWorkflows: b.query<TopWorkflowsDTO, { limit?: number } | void>({
            query: (arg) => `/widget/top-workflows?limit=${arg?.limit ?? 5}`,
        }),
    }),
})

export const { useGetExecutionsTimelineQuery, useGetTopWorkflowsQuery } = dashboardWidgetApi
