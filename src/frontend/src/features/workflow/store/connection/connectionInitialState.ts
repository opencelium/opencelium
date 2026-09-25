import type { Connection } from '../../types/connection';
import type { ConnectionState } from './connectionSlice.types';

export const connectionInitialState: ConnectionState = {
	connection: null,
	flowId: null,
};

export const createEmptyConnection = (connectionId: number): Connection => ({
	connectionId,
	name: '',
	description: '',
	fromConnector: {
		connectorId: -1,
		title: 'DEFAULT',
		method: [],
		operator: [],
	},
	toConnector: null,
	fieldBindings: [],
	ui: {
		flowcharts: [],
		flowchartEdges: [],
		operators: [],
	},
});
