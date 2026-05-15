export type ConnectionTemplate = {
    id: number
    name: string
    description: string
    version?: string
    connection: {
        fromConnector: { invoker: { name: string } }
        toConnector: { invoker: { name: string } }
    }
}
