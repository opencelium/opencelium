import type { buildMethodPayload } from '../../api/connectionPayload.methods';

export type PlaygroundDraft = ReturnType<typeof buildMethodPayload>;

// Where the values of the method's references come from before the user types over them.
// `upstream` sends no values: the backend runs the steps before this one and uses their responses.
export type PrefillSource = 'testRun' | 'lastTest' | 'sample' | 'upstream' | 'manual';

export type ProxyMode = 'system' | 'none' | 'custom';

export type PlaygroundSettings = {
	timeoutSec: number;
	retries: number;
	proxyMode: ProxyMode;
	proxyUrl: string;
	followRedirects: boolean;
	verifySsl: boolean;
	// Frontend only: a successful response replaces the method's sample response.
	saveResponseAsSample: boolean;
	logToHistory: boolean;
};

// `reference` is the reference text without its `{% %}` wrapper, exactly as it
// appears in the draft's endpoint/header/body — the backend substitutes `value`
// for every occurrence of it instead of reading a response that was never produced.
export type PlaygroundReferenceValue = { reference: string; value: unknown; isOverridden: boolean };

export type PlaygroundWebhookValue = { name: string; value: unknown };

export type PlaygroundRequest = {
	connectionId: number | null;
	// The connection the request goes to — any connector of the step's API definition.
	connectorId: number | null;
	method: PlaygroundDraft;
	// Only the bindings whose RESULT_VAR writes into this method's request, in the
	// save-payload format — the backend runs their scripts over `references`.
	fieldBindings: unknown[];
	references: PlaygroundReferenceValue[];
	webhooks: PlaygroundWebhookValue[];
	// Replaces the connector's own value of a `{field}` placeholder for this request only.
	requestData: Record<string, string>;
	runUpstream: boolean;
	settings: Omit<PlaygroundSettings, 'saveResponseAsSample'>;
};

export type PlaygroundSentRequest = {
	url: string;
	method: string;
	headers: Record<string, string>;
	body: unknown;
};

export type PlaygroundTimings = {
	dnsMs: number;
	connectMs: number;
	tlsMs: number;
	firstByteMs: number;
	downloadMs: number;
};

export type PlaygroundErrorStage = 'upstream' | 'resolve' | 'enhancement' | 'connect';

// A remote 4xx/5xx is still `success`: the call went through and its answer is
// the test result. `error` means no remote response exists at all.
export type PlaygroundResponse =
	| {
		kind: 'success';
		request: PlaygroundSentRequest;
		response: { status: number; headers: Record<string, string>; body: unknown };
		durationMs: number;
		timings?: PlaygroundTimings;
	}
	| {
		kind: 'error';
		stage: PlaygroundErrorStage;
		message: string;
		request?: PlaygroundSentRequest;
	};
