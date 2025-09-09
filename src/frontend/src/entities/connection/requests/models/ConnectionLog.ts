export interface ConnectionLogIdentifier {
	executionId: string;
	flowId: string;
	indexPath: string,
}
export type LogError = {
	message: string,
	stack_trace: string[],
} | null;
export interface ConnectionSocketLog<SegmentType> extends ConnectionLogIdentifier {
	id: string,
	connectorName: string;
	status: 'PENDING' | 'COMPLETE' | 'FAIL',
	type: 'OPERATION' | 'EXECUTION' | 'FLOWCHART' | 'LOOP' | 'IF' | 'UNKNOWN',
	properties: MethodProperty | OperatorProperty | FlowchartProperty,
	segment: SegmentType,
	error?: LogError,
}
export type LightSegment = LightMethodSegment | LightOperatorSegment;
export type DetailedSegment = DetailedMethodSegment | DetailedOperatorSegment;
interface LightMethodSegment {
	request: MethodRequest,
	response: MethodResponse
}
export type HttpMethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export interface MethodRequest {
	url: string,
	http_method: HttpMethodType,
}
interface MethodResponse {
	status: string,
	duration: string,
}
export interface DetailedMethodSegment {
	request: MethodRequest & DetailedMethod,
	response: MethodResponse & DetailedMethod
}
interface DetailedMethod {
	header: string,
	payload: any,
}
interface LightIfOperatorSegment {
	result: 'true' | 'false',
}
interface LightLoopOperatorSegment {

}
type LightOperatorSegment = LightIfOperatorSegment | LightLoopOperatorSegment;
export interface DetailedIfOperatorSegment extends LightIfOperatorSegment{
	refs: {ref: string, value: any}[],
}
interface DetailedLoopOperatorSegment extends LightLoopOperatorSegment {
	refs: {ref: string, value: any}[],
}
export type DetailedOperatorSegment = DetailedIfOperatorSegment | DetailedLoopOperatorSegment;
interface BaseChildProperty {
	loopIndex?: string,
	loopIterator?: string,
}
interface BaseOperatorProperty extends BaseChildProperty{
	expression: string,
}
export interface FlowchartProperty {
	CONNECTOR_ID: string,
	DIRECTION: 'source' | 'target',
}
export interface MethodProperty extends BaseChildProperty{
	name: string,
}
export interface IfOperatorProperty extends BaseOperatorProperty{
}
export interface LoopOperatorProperty extends BaseOperatorProperty {
	size: number,
	iterator: string,
}
type OperatorProperty = IfOperatorProperty | LoopOperatorProperty;
export interface ConnectionTextLog {
	message: string,
	type: 'INFO',
	datetime: string,
}

export interface ConnectorLog {
	name: string;
	flowId: string,
	traces: Trace[];
}


export type Trace = (ConnectionSocketLog<LightSegment> | ConnectionSocketLog<DetailedSegment>) & MetaTrace;

export interface MetaTrace {
	children?: Trace[],
	isCompleted?: boolean,
	hasError?: boolean,
}

