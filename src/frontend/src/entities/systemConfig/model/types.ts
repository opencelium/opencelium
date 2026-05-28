export type ConfigStatus = 'active' | 'inactive'

export type ConfigScalar = string | number | boolean | null

/** A leaf holds a scalar or a scalar array; a container holds child nodes. */
export type ConfigNodeValue = ConfigScalar | ConfigScalar[] | ConfigNode[]

export type NodeCommentPosition = 'before' | 'inline' | 'after'

export type NodeComment = {
    position: NodeCommentPosition
    text: string
}

export type EnvelopeCommentPosition = 'header' | 'footer'

export type EnvelopeComment = {
    position: EnvelopeCommentPosition
    text: string
}

export type ConfigNode = {
    key: string
    path: string
    status: ConfigStatus
    value: ConfigNodeValue
    comments?: NodeComment[]
}

export type ApplicationConfigResponse = {
    fields: ConfigNode[]
    comments: EnvelopeComment[]
}

/** A single changed node in a PATCH body, matched on disk by `path`. */
export type ConfigPatchNode = {
    path: string
    status?: ConfigStatus
    value?: ConfigScalar | ConfigScalar[]
}

export type ApplicationConfigPatchRequest = {
    fields: ConfigPatchNode[]
    /** Accepted for round-trip shape compatibility but ignored by the server. */
    comments?: EnvelopeComment[]
}

export type ApplicationConfigPatchResponse = {
    status: string
    restartRequired: boolean
    message: string
}

/** A pending, uncommitted change to one node, keyed by path in the page. */
export type NodeEdit = {
    value?: ConfigScalar | ConfigScalar[]
    status?: ConfigStatus
}

function isConfigNode(value: unknown): value is ConfigNode {
    return (
        typeof value === 'object' &&
        value !== null &&
        'path' in value &&
        'status' in value
    )
}

/** A node is a container when its value is an array of child ConfigNodes. */
export function isContainerNode(node: ConfigNode): boolean {
    return Array.isArray(node.value) && node.value.length > 0 && isConfigNode(node.value[0])
}
