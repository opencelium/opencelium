import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Enhancement, MethodWithId, OperatorWithId } from '../../types/connection';
import { connectionInitialState } from './connectionInitialState';
import type {
	RemoveEndpointArgAction,
	UpdateEndpointAction,
	UpdateMethodTypeAction,
	UpdatePayloadAction,
	UpdateQueryParamsAction,
	UpsertEndpointArgAction,
} from './connectionSlice.types';
import { removeMethodEndpointArg, updateMethodEndpoint, updateMethodHttpMethod,
	updateMethodPayload, updateMethodQueryParams,
	upsertMethodEndpointArg } from './connectionMethodUpdates';
import {
	addConnectionMethod,
	addConnectionOperator,
	removeConnectionFieldBinding,
	removeConnectionMethod,
	removeConnectionOperator,
	upsertConnectionFieldBinding,
} from './connectionCollections';
import { connectionBaseReducers } from './connectionBaseReducers';

export const connectionSlice = createSlice({
	name: 'connection',
	initialState: connectionInitialState,
	reducers: {
		...connectionBaseReducers,
		addMethod: (state, action: PayloadAction<MethodWithId>) => {
			if (!state.connection) return;
			state.connection = addConnectionMethod(state.connection, action.payload);
		},
		removeMethod: (state, action: PayloadAction<string>) => {
			if (!state.connection) return;
			state.connection = removeConnectionMethod(state.connection, action.payload);
		},
		addOperator: (state, action: PayloadAction<OperatorWithId>) => {
			if (!state.connection) return;
			state.connection = addConnectionOperator(state.connection, action.payload);
		},
		removeOperator: (state, action: PayloadAction<string>) => {
			if (!state.connection) return;
			state.connection = removeConnectionOperator(state.connection, action.payload);
		},
		updatePayload: (state, action: PayloadAction<UpdatePayloadAction>) => {
			const { methodId, newFields, messageProperty } = action.payload;
			if (!state.connection) return;
			state.connection = updateMethodPayload(
				state.connection, methodId, newFields, messageProperty);
		},

		updateEndpoint: (state, action: PayloadAction<UpdateEndpointAction>) => {
			const { methodId, endpoint } = action.payload;
			if (!state.connection) return;
			state.connection = updateMethodEndpoint(state.connection, methodId, endpoint);
		},
		updateRequestMethod: (state, action: PayloadAction<UpdateMethodTypeAction>) => {
			const { methodId, method: httpMethod } = action.payload;
			if (!state.connection) return;
			state.connection = updateMethodHttpMethod(state.connection, methodId, httpMethod);
		},
		updateQueryParams: (state, action: PayloadAction<UpdateQueryParamsAction>) => {
			const { methodId, queryParams } = action.payload;
			if (!state.connection) return;
			state.connection = updateMethodQueryParams(state.connection, methodId, queryParams);
		},

		upsertEndpointArg: (state, action: PayloadAction<UpsertEndpointArgAction>) => {
			const { methodId, argId, patch } = action.payload;
			if (!state.connection) return;
			state.connection = upsertMethodEndpointArg(
				state.connection, methodId, argId, patch);
		},

		removeEndpointArg: (state, action: PayloadAction<RemoveEndpointArgAction>) => {
			const { methodId, argId } = action.payload;
			if (!state.connection) return;
			state.connection = removeMethodEndpointArg(state.connection, methodId, argId);
		},
		upsertFieldBinding: (state, action: PayloadAction<{ enhancement: Enhancement }>) => {
			if (!state.connection) return;
			state.connection = upsertConnectionFieldBinding(
				state.connection, action.payload.enhancement);
		},

		removeFieldBinding: (state, action: PayloadAction<{ enhanceId: string }>) => {
			if (!state.connection) return;
			state.connection = removeConnectionFieldBinding(
				state.connection, action.payload.enhanceId);
		},
	},
});

export const {
	setConnection,
	updateConnection,
	clearConnection,
	setInitialConnection,
	addFlowchart,
	updatePayload,
	setFlowchart,
	clearFlowchart,
	removeFlowchart,
	addMethod,
	removeMethod,
	addOperator,
	removeOperator,
	updateEndpoint,
	updateRequestMethod,
	updateQueryParams,
	upsertEndpointArg,
	removeEndpointArg,
	upsertFieldBinding,
	removeFieldBinding,
} = connectionSlice.actions;
export default connectionSlice.reducer;
