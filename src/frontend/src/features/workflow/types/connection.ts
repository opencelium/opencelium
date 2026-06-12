export interface Connection {
    connectionId: number,
    name: string;
    description: string;
    fromConnector: ConnectorFlow,
    toConnector: ConnectorFlow | null,
    fieldBindings: FieldBinding[],
    executionPlan?: {
        mode: 'SEQUENTIAL' | 'PARALLEL',
        steps: string[],
        onError: {
            strategy: "STOP",
            retry: {
                maxAttempts: number,
                backOffMs: number,
            }
        }
    },
    ui: UI,
}

export interface FieldBinding {
    enhancement: Enhancement,
}

export interface Enhancement {
    enhanceId: string,
    description?: string,
    language: Language,
    script: string,
    args: Record<string, string>,
}

export const Language = {
    JavaScript: 'js',
    Python3: 'python3',
    Ruby: 'ruby',
} as const;

export type Language = (typeof Language)[keyof typeof Language];

export interface ConnectorFlow {
    connectorId: number,
    title: string,
    method: MethodWithId[],
    operator: OperatorWithId[],
}
export interface Method {
    index: string,
    name: string,
    color: string,
    label?: string,
    dataAggregator?: string | null,
    request: MethodRequest,
    response: MainResponse,
}

export interface MethodWithId extends Method {
    id: string,
    connector: {
        connectorId: number,
        title: string,
        icon?: string | null,
    },
}

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
    argId?: string;
}

export interface MethodRequest {
    requestId: string,
    endpoint: string,
    method: string,
    header: Record<string, string>,
    body: PayloadData,
	queryParams?: QueryParam[];
    endpointArgs?: Record<string, EndpointArg>;
}

export interface MainResponse {
    responseId: string,
    success: MethodResponse,
    fail: MethodResponse,
}

export interface MethodResponse {
    status: string,
    header: Record<string, string>,
    body: PayloadData,
}

export interface PayloadData {
    type: PayloadType,
    format: PayloadFormat,
    data: PayloadDataType,
    fields: any,
}

export const PayloadType = {
    Object: 'object',
    Array: 'array',
    String: 'string',
} as const;

export type PayloadType = (typeof PayloadType)[keyof typeof PayloadType];

export const PayloadFormat = {
    Json: 'json',
    Xml: 'xml',
    UrlEncoded: 'x-www-form-urlencoded',
} as const;

export type PayloadFormat = (typeof PayloadFormat)[keyof typeof PayloadFormat];

export const PayloadDataType = {
    Raw: 'raw',
    GraphQL: 'graphql',
} as const;

export type PayloadDataType = (typeof PayloadDataType)[keyof typeof PayloadDataType];

export type Operator = IfOperator | LoopOperator;

export type OperatorWithId = IfOperatorWithId | LoopOperatorWithId


export interface GeneralOperator  {
    index: string,
    ui?: string | null,
    dataAggregator?: string | null,
    expression?: string,
}
export interface GeneralOperatorWithId extends GeneralOperator {
    id: string,
}
export interface IfOperator extends GeneralOperator{
    type: typeof OperatorType.If,
}

export interface LoopOperator extends GeneralOperator {
    iterator: string,
    type: typeof OperatorType.Loop,
}

export interface IfOperatorWithId extends GeneralOperatorWithId{
    type: typeof OperatorType.If,
}

export interface LoopOperatorWithId extends GeneralOperatorWithId {
    iterator: string,
    type: typeof OperatorType.Loop,
}

export const OperatorType = {
    Loop: 'loop',
    If: 'if',
} as const;

export type OperatorType = (typeof OperatorType)[keyof typeof OperatorType];


export interface UI {
    flowcharts: {
        flowId: string,
        x: number,
        y: number,
    }[],
    flowchartEdges: {
        id: string,
        source: string,
        target: string,
    }[],
    operators: any[],
}
