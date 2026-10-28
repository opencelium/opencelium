export type FieldNode = {
    name: string
    type: string
    /** Default value from the template; `{apikey}`-style placeholders are filled from connector settings. */
    value: string
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

/** How a connector of this invoker connects: what it asks for, how it authenticates, and the call its test makes. */
export type InvokerSetup = {
    authType: string
    /** `value` is the invoker's default or template (`Basic {username:password}`), never a customer's secret. */
    settings: { name: string; visibility: string; value: string }[]
    test?: { name: string; method: string; endpoint: string; headers: { name: string; value: string }[] }
}

export type Invoker = {
    name: string
    description: string
    requiredData: string[]
    /** Workflow-usable operations; the connector's "test" operation is excluded. */
    operations: InvokerOperation[]
    setup?: InvokerSetup
}

export type InvokerSummary = {
    name: string
    description: string
    operationCount: number
}
