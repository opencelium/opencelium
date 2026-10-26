export type FieldNode = {
    name: string
    type: string
    children: FieldNode[]
}

export type InvokerOperation = {
    name: string
    httpMethod: string
    endpoint: string
    /** Endpoint placeholders the workflow must fill, e.g. ISSUEID; connector settings such as url are excluded. */
    endpointParams: string[]
    requestFields: FieldNode[]
    responseFields: FieldNode[]
}

export type Invoker = {
    name: string
    description: string
    requiredData: string[]
    /** Workflow-usable operations; the connector's "test" operation is excluded. */
    operations: InvokerOperation[]
}

export type InvokerSummary = {
    name: string
    description: string
    operationCount: number
}
