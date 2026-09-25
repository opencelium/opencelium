import type { PayloadAction } from '@reduxjs/toolkit';
import type { Connection } from '../../types/connection';
import type { Connector } from '../../types/connector';
import { attachFlowchartConnector } from './connectionFlowchart';
import { createEmptyConnection } from './connectionInitialState';
import type { ConnectionState } from './connectionSlice.types';

export const connectionBaseReducers = {
	setInitialConnection: (state: ConnectionState, action: PayloadAction<number>) => {
		state.connection = createEmptyConnection(action.payload);
	},
	setConnection: (state: ConnectionState, action: PayloadAction<Connection>) => {
		state.connection = action.payload;
	},
	updateConnection: (state: ConnectionState, action: PayloadAction<Partial<Connection>>) => {
		if (state.connection) {
			state.connection = { ...state.connection, ...action.payload };
		}
	},
	clearConnection: (state: ConnectionState) => {
		state.connection = null;
	},
	addFlowchart: (
		state: ConnectionState,
		action: PayloadAction<{ flowId: string; connector: Connector }>,
	) => {
		if (!state.connection) return;
		state.flowId = action.payload.flowId;
		state.connection = attachFlowchartConnector(state.connection, action.payload.connector);
	},
	removeFlowchart: (state: ConnectionState, action: PayloadAction<string>) => {
		if (state.connection && state.flowId === action.payload) state.flowId = null;
	},
	setFlowchart: (state: ConnectionState, action: PayloadAction<string>) => {
		state.flowId = action.payload;
	},
	clearFlowchart: (state: ConnectionState) => {
		state.flowId = null;
	},
};
