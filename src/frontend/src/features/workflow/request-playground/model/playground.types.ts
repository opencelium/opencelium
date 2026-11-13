import type { buildMethodPayload } from '../../api/connectionPayload.methods';

export type PlaygroundDraft = ReturnType<typeof buildMethodPayload>;

// Where the values of the method's references come from before the user types over them.
export type PrefillSource = 'testRun' | 'execution' | 'lastTest' | 'sample' | 'manual';

export type StaticReferenceType = 'DIRECT' | 'WRAPPED_DIRECT' | 'WEBHOOK' | 'ENHANCEMENT' | 'PAGE' | 'REQUEST_DATA';

// `available: false` means the connector does not exist or lacks `key`: the backend
// then sends the reference as written.
export type ConnectorReference = { reference: string; connectorId: number; key: string; available: boolean };

// `type` is null when the text only looks like a reference.
export type StaticReference = { reference: string; type: StaticReferenceType | null };

export type MethodTestRefs = {
	connectorReferences: ConnectorReference[];
	staticReferences: StaticReference[];
};

export type MethodTestRequest = {
	method: PlaygroundDraft;
	// Keyed by the exact reference text from /refs. A connector reference given here
	// overrides the connector's own value for this test.
	staticValues: Record<string, unknown>;
	confirmWrite: boolean;
};

export type MultiValueHeaders = Record<string, string[]>;

export type MethodTestSentRequest = { method: string; url: string; headers: MultiValueHeaders; body: unknown };

export type MethodTestReceivedResponse = { status: number; headers: MultiValueHeaders; body: unknown };

export type ConnectorError = { connectorId: number; message: string };

export type MethodTestResult = {
	request: MethodTestSentRequest | null;
	response: MethodTestReceivedResponse | null;
	durationMs: number | null;
	connectorErrors: ConnectorError[];
};

// What the response panel shows. A remote 4xx/5xx is still `sent`: the call went
// through and its answer is the test result.
export type PlaygroundResult =
	| { kind: 'sent'; request: MethodTestSentRequest; response: MethodTestReceivedResponse; durationMs: number }
	| { kind: 'connectorErrors'; errors: ConnectorError[] }
	| { kind: 'failed'; message: string | null };

// The request as the playground expects it to go out, built locally for the URL bar and cURL.
export type PlaygroundPreviewRequest = { url: string; method: string; headers: Record<string, string>; body: unknown };
