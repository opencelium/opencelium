
export type Invoker = {
    name: string
    description: string
    authType: 'basic' | string
    hasManualSync: boolean
    hint: string
    icon: string
    operations: InvokerOperation[]
    requiredData: Record<string, string>
}

export type InvokerOperation = {
    name: string
    type: 'test' | string
    request: OperationRequest
    response: OperationResponse
}

export type OperationRequest = {
    body: OperationBody
    endpoint: string
    header: Record<string, string>
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
}

export type OperationResponse = {
    name: string
    success: ResponseResult
    fail: ResponseResult
}

export type ResponseResult = {
    status: string
    header: Record<string, string>
    body: OperationBody
}

export type OperationBody = {
    data: 'raw' | 'graphql'
    fields: any
    format: 'xml' | 'json' | 'x-www-form-urlencoded'
    type: 'object' | 'array' | 'string'
}

/**
 * What `POST /invoker/remote` reports back. The installed entries carry the same
 * metadata as `GET /invoker/all?opsIncluded=false`, so `operations` is absent —
 * fetch the invoker by name when the operations are actually needed.
 */
export type InvokerMeta = Omit<Invoker, 'operations'>

export type InvokerRepositoryFailure = {
    fileName: string
    /** Backend-authored, already user-readable sentence. Not an i18n key. */
    reason: string
}

export type InvokerRepositoryDownload = {
    installed: InvokerMeta[]
    failed: InvokerRepositoryFailure[]
}
