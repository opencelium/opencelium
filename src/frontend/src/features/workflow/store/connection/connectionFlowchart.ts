import type { Connection } from '../../types/connection';
import type { Connector } from '../../types/connector';

export const attachFlowchartConnector = (
	connection: Connection,
	connector: Connector,
): Connection => ({
	...connection,
	fromConnector: {
		...connection.fromConnector,
		connectorId: connector.connectorId,
		title: connector.title,
	},
});
