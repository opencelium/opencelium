// The GET /connection/{id} response is the full "workflow" object. Duplicating
// it means re-POSTing the same shape with every server-assigned identifier
// stripped (so the backend treats it as a brand-new connection) plus the new
// title/description the user typed.

type RawRecord = Record<string, unknown>

type RawConnectorSide = {
    methods?: RawRecord[]
    operators?: RawRecord[]
} & RawRecord

type RawConnectionWorkflow = {
    id?: unknown
    connectionId?: unknown
    nodeId?: unknown
    fieldBinding?: RawRecord[]
    fromConnector?: RawConnectorSide
    toConnector?: RawConnectorSide
} & RawRecord

const omitKeys = (source: RawRecord, keys: string[]): RawRecord =>
    Object.fromEntries(Object.entries(source).filter(([key]) => !keys.includes(key)))

const omitNodeId = (item: RawRecord): RawRecord => omitKeys(item, ['nodeId'])

const cleanConnectorSide = (side: RawConnectorSide): RawConnectorSide => ({
    ...side,
    ...(Array.isArray(side.methods) ? { methods: side.methods.map(omitNodeId) } : {}),
    ...(Array.isArray(side.operators) ? { operators: side.operators.map(omitNodeId) } : {}),
})

export function cleanConnectionForDuplicate(
    source: RawConnectionWorkflow,
    overrides: { title: string; description: string },
): RawConnectionWorkflow {
    const rest = omitKeys(source, ['id', 'connectionId', 'nodeId']) as RawConnectionWorkflow

    return {
        ...rest,
        title: overrides.title,
        description: overrides.description,
        ...(Array.isArray(rest.fieldBinding) ? { fieldBinding: rest.fieldBinding.map(omitNodeId) } : {}),
        ...(rest.fromConnector ? { fromConnector: cleanConnectorSide(rest.fromConnector) } : {}),
        ...(rest.toConnector ? { toConnector: cleanConnectorSide(rest.toConnector) } : {}),
    }
}
