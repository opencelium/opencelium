export interface DashboardSchema {
    dashboard: {
        header: {
            title: string
            subtitle: string
        }
        comingSoon: string
        waitingApi: string
        connection: {
            errorTitle: string
            errorDescription: string
            statusConnected: string
            statusConnecting: string
            statusDisconnected: string
        }
        metrics: {
            executions: string
            failureRate: string
            avgRuntime: string
            runtime: string
            logs: string
            noData: string
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
