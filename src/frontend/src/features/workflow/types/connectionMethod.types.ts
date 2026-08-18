import type { Enhancement } from './connectionEnhancement.types';

export interface Method {
	index: string;
	name: string;
	color: string;
	label?: string;
	dataAggregator?: number | null;
	methodType: MethodType;
	request: MethodRequest;
	response: MainResponse;
}

export interface MethodWithId extends Method {
	id: string;
	connector: {
		connectorId: number;
		title: string;
		icon?: string | null;
	} | null;
}

export const MethodType = {
	Connector: 'CONNECTOR',
	HttpRequest: 'HTTP_REQUEST',
	Webhook: 'WEBHOOK',
} as const;

export type MethodType = (typeof MethodType)[keyof typeof MethodType];

export interface EndpointArg {
	id: string;
	source?: string;
	enhancement?: Enhancement;
}

export interface QueryParam {
	id: string;
	key: string;
	value: string;
	enabled: boolean;
	autoEncode?: boolean;
	argId?: string;
}

export interface MethodRequest {
	requestId: string;
	endpoint: string;
	method: string;
	header: Record<string, string>;
	body: PayloadData;
	queryParams?: QueryParam[];
	endpointArgs?: Record<string, EndpointArg>;
}

export interface MainResponse {
	responseId: string;
	success: MethodResponse;
	fail: MethodResponse;
}

export interface MethodResponse {
	status: string;
	header: Record<string, string>;
	body: PayloadData;
}

export interface PayloadData {
	type: PayloadType;
	format: PayloadFormat;
	data: PayloadDataType;
	fields: any;
}

export const PayloadType = { Object: 'object', Array: 'array', String: 'string' } as const;
export type PayloadType = (typeof PayloadType)[keyof typeof PayloadType];

export const PayloadFormat = {
	Json: 'json',
	Xml: 'xml',
	UrlEncoded: 'x-www-form-urlencoded',
} as const;
export type PayloadFormat = (typeof PayloadFormat)[keyof typeof PayloadFormat];

export const PayloadDataType = { Raw: 'raw', GraphQL: 'graphql' } as const;
export type PayloadDataType = (typeof PayloadDataType)[keyof typeof PayloadDataType];
