export type GraphQlQueryParams = {
    url: string
    accessToken: string
    trustAnyCertificate: boolean
    query: string
    variables?: Record<string, unknown>
    operationName?: string | null
}

export type GraphQlQueryResult = {
    data?: unknown
    errors?: Array<{
        message: string
        extensions?: {
            causes?: Array<{ error?: string }>
        }
    }>
}
