import type {Connector, ConnectorUpdateDto} from '@entities/connector/model/types'

export const buildDuplicateConnectorValues = (
    connector: Connector,
): Partial<ConnectorUpdateDto> => ({
    connectorId: connector.connectorId,
    title: `${connector.title} (copy)`,
    description: connector.description ?? '',
    invoker: connector.invoker?.name ?? '',
    timeout: connector.timeout?.toString() ?? '',
    sslCert: connector.sslCert ?? false,
    requestData: undefined,
    icon: null,
    iconOriginal: null,
})
