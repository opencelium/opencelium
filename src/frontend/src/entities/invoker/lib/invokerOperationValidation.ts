type BodyConfig = {
    format?: unknown
    type?: unknown
    bodyJson?: unknown
}

const isBodyTypeValid = (body: BodyConfig | undefined): boolean => {
    if (!body || body.format !== 'json' || typeof body.bodyJson !== 'string') return true

    try {
        const parsed = JSON.parse(body.bodyJson)
        if (body.type === 'array') return Array.isArray(parsed)
        if (body.type === 'object') {
            return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        }
        return true
    } catch {
        return true
    }
}

export const areInvokerOperationBodyTypesValid = (value: unknown): boolean => {
    if (!Array.isArray(value)) return true

    return value.every((item) => {
        if (!item || typeof item !== 'object') return false
        const operation = item as {
            request?: BodyConfig
            response?: { success?: BodyConfig; fail?: BodyConfig }
        }
        return isBodyTypeValid(operation.request) &&
            isBodyTypeValid(operation.response?.success) &&
            isBodyTypeValid(operation.response?.fail)
    })
}
