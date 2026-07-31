export type HealthStatus = 'UP' | 'DOWN' | 'UNKNOWN'

export type HealthComponent = {
    status: HealthStatus
    details?: Record<string, unknown>
}

export type SystemHealth = {
    status: HealthStatus
    components: {
        email?: HealthComponent
        mariaDB?: HealthComponent
        mongoDB?: HealthComponent
        opencelium?: HealthComponent
        os?: HealthComponent
        polyglot?: HealthComponent
    }
}

export type UpdateVersionStatus = 'old' | 'current' | 'available'

export type UpdateVersion = {
    name: string
    changelogLink: string
    status: UpdateVersionStatus
    instruction: string
}

export type UpdateMode = 'online' | 'offline'

export type InstallationInfo = {
    type: string
}

export type UpdateAssistantForm = {
    systemHealth: SystemHealth | null
    updateMode: UpdateMode
    versionsDisplay: UpdateVersion[]
    file: File | null
    runUpdateAction: null
}
