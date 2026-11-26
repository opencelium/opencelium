import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'

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

export const attentionItems: AttentionItem[] = [
    {
        id: 'a-1',
        title: 'ERP -> CRM sync failed',
        subtitle: 'Connection: ERP_to_CRM',
        severity: 'critical',
        timeAgo: '4m ago',
    },
    {
        id: 'a-2',
        title: 'API token expires soon',
        subtitle: 'Renew within 2 days',
        severity: 'warning',
        timeAgo: '1h ago',
    },
    {
        id: 'a-3',
        title: 'Ticket import timeout',
        subtitle: 'Retry policy reached limit',
        severity: 'critical',
        timeAgo: '2h ago',
    },
    {
        id: 'a-4',
        title: 'ERP data export stalled',
        subtitle: 'Awaiting confirmation',
        severity: 'warning',
        timeAgo: '5h ago',
    },
    {
        id: 'a-5',
        title: 'Helpdesk sync incomplete',
        subtitle: '14 records skipped',
        severity: 'info',
        timeAgo: '1d ago',
    },
]

export const recentActivity: ActivityItem[] = [
    {
        id: 'r-1',
        title: 'Sync job completed',
        subtitle: 'Webshop -> Database',
        kind: 'success',
        timeAgo: '2m ago',
        icon: 'check',
    },
    {
        id: 'r-2',
        title: 'Notification dispatched',
        subtitle: 'Chat channel #ops',
        kind: 'info',
        timeAgo: '5m ago',
        icon: 'notification',
    },
    {
        id: 'r-3',
        title: 'CRM webhook received',
        subtitle: 'Lead conversion event',
        kind: 'info',
        timeAgo: '8m ago',
        icon: 'webhook',
    },
    {
        id: 'r-4',
        title: 'ERP data export started',
        subtitle: 'Daily snapshot',
        kind: 'info',
        timeAgo: '11m ago',
        icon: 'play',
    },
    {
        id: 'r-5',
        title: 'Helpdesk sync completed',
        subtitle: '320 records',
        kind: 'success',
        timeAgo: '20m ago',
        icon: 'check',
    },
]

