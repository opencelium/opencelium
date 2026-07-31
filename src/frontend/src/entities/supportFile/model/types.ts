export type SupportFileStatus = 'CONNECTION_FOUND' | 'CONNECTION_IS_MISSING'

export type SupportFile = {
    connectionId: number
    connectionTitle: string | null
    supportFile: string
    status: SupportFileStatus
    message: string
}
