export interface MetaConnectionModel {
    id: number,
    title: string,
    description: string,
    fromConnector: MetaConnectorModel,
    toConnector: MetaConnectorModel,
}

export interface MetaConnectorModel {
    connectorId: number,
    title: string,
    description: string,
    icon?: string | null,
    invoker: MetaInvokerModel,
    sslCert: boolean,
    timeout: number,
}

export interface MetaInvokerModel {
    name: string,
    authType: string,
    description: string,
    hint: string,
    icon: string | null,
}
