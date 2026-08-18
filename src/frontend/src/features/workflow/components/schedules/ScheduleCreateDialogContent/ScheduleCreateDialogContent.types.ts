export type ScheduleCreateDialogContentProps = {
    connectionId: string
    connectionTitle: string
    onSuccess: () => void
}

export type ScheduleCreateForm = {
    title: string
    debugMode: boolean
    cronExp: string
}
