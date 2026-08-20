import type { Connection } from '../../types/connection';

export interface ConnectionState {
	connection: Connection | null;
	flowId: string | null;
}

export interface UpdatePayloadAction {
	methodId: string;
	newFields: any;
	messageProperty: 'body' | 'header';
}

export interface UpdateEndpointAction {
	methodId: string;
	endpoint: string;
}

export interface UpdateMethodTypeAction {
	methodId: string;
	method: string;
}

export interface UpdateQueryParamsAction {
	methodId: string;
	queryParams: any[];
}

export interface UpsertEndpointArgAction {
	methodId: string;
	argId: string;
	patch: any;
}

export interface RemoveEndpointArgAction {
	methodId: string;
	argId: string;
}
