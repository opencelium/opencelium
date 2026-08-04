
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
