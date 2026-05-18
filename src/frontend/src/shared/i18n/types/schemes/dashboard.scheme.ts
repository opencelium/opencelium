export interface DashboardSchema {
    dashboard: {
        header: {
            title: string
            subtitle: string
        }
        rangeFilter: {
            last7days: string
            last30days: string
            last24h: string
        }
        metrics: {
            executions: string
            failureRate: string
            avgRuntime: string
            runningJobs: string
            apiUsage: string
            noData: string
        }
        delta: {
            vsPrevious: string
        }
        attention: {
            title: string
            viewAll: string
            empty: string
        }
        recentActivity: {
            title: string
            viewAll: string
            empty: string
        }
        systemHealth: {
            title: string
            healthy: string
            warning: string
            critical: string
            statusHealthy: string
        }
        executionsChart: {
            title: string
            executions: string
            failures: string
        }
        resourceUsage: {
            title: string
            cpu: string
            memory: string
        }
        topConnectors: {
            title: string
            name: string
            executions: string
            failureRate: string
        }
    }
}
