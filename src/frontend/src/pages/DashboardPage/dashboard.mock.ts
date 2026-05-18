import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'
import type { Metrics } from '@widgets/SystemMetrics/model/types'

export type AttentionSeverity = 'critical' | 'warning' | 'info'

export type AttentionItem = {
    id: string
    title: string
    subtitle: string
    severity: AttentionSeverity
    timeAgo: string
}

export type ActivityKind = 'success' | 'failure' | 'info' | 'warning'

export type ActivityItem = {
    id: string
    title: string
    subtitle: string
    kind: ActivityKind
    timeAgo: string
    icon: IconName
}

export type HealthSlice = {
    key: 'healthy' | 'warning' | 'critical'
    value: number
    label: string
}

export type ChartPoint = { label: string; value: number }

export type ResourceSeries = {
    current: number
    points: ChartPoint[]
}

export type TopConnector = {
    id: string
    name: string
    executions: number
    failureRate: number
}

export const attentionItems: AttentionItem[] = [
    {
        id: 'a-1',
        title: 'SAP -> Salesforce Sync failed',
        subtitle: 'Connection: SAP_to_Salesforce',
        severity: 'critical',
        timeAgo: '4m ago',
    },
    {
        id: 'a-2',
        title: 'Microsoft 365 token expires soon',
        subtitle: 'Renew within 2 days',
        severity: 'warning',
        timeAgo: '1h ago',
    },
    {
        id: 'a-3',
        title: 'KIA Ticket import timeout',
        subtitle: 'Retry policy reached limit',
        severity: 'critical',
        timeAgo: '2h ago',
    },
    {
        id: 'a-4',
        title: 'SAP data export stalled',
        subtitle: 'Awaiting confirmation',
        severity: 'warning',
        timeAgo: '5h ago',
    },
    {
        id: 'a-5',
        title: 'NetFlix sync incomplete',
        subtitle: '14 records skipped',
        severity: 'info',
        timeAgo: '1d ago',
    },
]

export const recentActivity: ActivityItem[] = [
    {
        id: 'r-1',
        title: 'Sync job completed',
        subtitle: 'Shopify -> Postgres',
        kind: 'success',
        timeAgo: '2m ago',
        icon: 'check',
    },
    {
        id: 'r-2',
        title: 'Notification dispatched',
        subtitle: 'Slack channel #ops',
        kind: 'info',
        timeAgo: '5m ago',
        icon: 'notification',
    },
    {
        id: 'r-3',
        title: 'Salesforce webhook received',
        subtitle: 'Lead conversion event',
        kind: 'info',
        timeAgo: '8m ago',
        icon: 'webhook',
    },
    {
        id: 'r-4',
        title: 'SAP data export started',
        subtitle: 'Daily snapshot',
        kind: 'info',
        timeAgo: '11m ago',
        icon: 'play',
    },
    {
        id: 'r-5',
        title: 'NetFlix sync completed',
        subtitle: '320 records',
        kind: 'success',
        timeAgo: '20m ago',
        icon: 'check',
    },
]

export const systemHealth: HealthSlice[] = [
    { key: 'healthy', value: 78, label: 'Healthy' },
    { key: 'warning', value: 16, label: 'Warning' },
    { key: 'critical', value: 6, label: 'Critical' },
]

export const executionsChart: { executions: ChartPoint[]; failures: ChartPoint[] } = {
    executions: [
        { label: 'Mon', value: 124 },
        { label: 'Tue', value: 162 },
        { label: 'Wed', value: 148 },
        { label: 'Thu', value: 198 },
        { label: 'Fri', value: 240 },
        { label: 'Sat', value: 96 },
        { label: 'Sun', value: 78 },
    ],
    failures: [
        { label: 'Mon', value: 18 },
        { label: 'Tue', value: 22 },
        { label: 'Wed', value: 14 },
        { label: 'Thu', value: 33 },
        { label: 'Fri', value: 41 },
        { label: 'Sat', value: 9 },
        { label: 'Sun', value: 6 },
    ],
}

export const resourceUsage: { cpu: ResourceSeries; memory: ResourceSeries } = {
    cpu: {
        current: 0.91,
        points: [
            { label: 'Mon', value: 0.42 },
            { label: 'Tue', value: 0.58 },
            { label: 'Wed', value: 0.51 },
            { label: 'Thu', value: 0.76 },
            { label: 'Fri', value: 1.04 },
            { label: 'Sat', value: 0.62 },
            { label: 'Sun', value: 0.91 },
        ],
    },
    memory: {
        current: 4.56 * 1024 * 1024 * 1024,
        points: [
            { label: 'Mon', value: 3.1 * 1024 * 1024 * 1024 },
            { label: 'Tue', value: 3.4 * 1024 * 1024 * 1024 },
            { label: 'Wed', value: 3.6 * 1024 * 1024 * 1024 },
            { label: 'Thu', value: 3.9 * 1024 * 1024 * 1024 },
            { label: 'Fri', value: 4.2 * 1024 * 1024 * 1024 },
            { label: 'Sat', value: 4.4 * 1024 * 1024 * 1024 },
            { label: 'Sun', value: 4.56 * 1024 * 1024 * 1024 },
        ],
    },
}

export const topConnectors: TopConnector[] = [
    { id: 'c-1', name: 'SAP_to_Salesforce', executions: 1245, failureRate: 4.2 },
    { id: 'c-2', name: 'Shopify_to_Postgres', executions: 982, failureRate: 1.1 },
    { id: 'c-3', name: 'M365_to_Slack', executions: 781, failureRate: 0.5 },
    { id: 'c-4', name: 'KIA_Tickets', executions: 624, failureRate: 11.8 },
    { id: 'c-5', name: 'NetFlix_to_S3', executions: 510, failureRate: 2.3 },
]

export const systemMetricsMock: Metrics = {
    executions: 1046,
    failureRate: 13.7,
    avgRuntimeMs: 4520,
    runningJobs: 7,
    apiUsageBytes: 2.4 * 1024 * 1024 * 1024,
    executionsDelta: 8.4,
    failureRateDelta: -2.1,
    avgRuntimeDelta: -5.6,
    runningJobsDelta: 16.7,
    apiUsageDelta: 3.2,
}
