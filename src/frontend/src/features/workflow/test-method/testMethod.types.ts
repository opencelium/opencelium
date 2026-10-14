import type { buildMethodPayload } from '../api/connectionPayload.methods';

export type TestMethodDraft = ReturnType<typeof buildMethodPayload>;

// `reference` is the reference text without its `{% %}` wrapper, exactly as it
// appears in the draft's endpoint/header/body — the backend substitutes `value`
// for every occurrence of it instead of reading a response that was never produced.
export type TestMethodReferenceValue = { reference: string; value: unknown };

export type TestMethodWebhookValue = { name: string; value: unknown };

export type TestMethodRequest = {
	connectionId: number | null;
	method: TestMethodDraft;
	// Only the bindings whose RESULT_VAR writes into this method's request, in the
	// save-payload format — the backend runs their scripts over `references`.
	fieldBindings: unknown[];
	references: TestMethodReferenceValue[];
	webhooks: TestMethodWebhookValue[];
};

export type TestMethodSentRequest = {
	url: string;
	method: string;
	headers: Record<string, string>;
	body: unknown;
};

export type TestMethodErrorStage = 'resolve' | 'enhancement' | 'connect';

// A remote 4xx/5xx is still `success`: the call went through and its answer is
// the test result. `error` means no remote response exists at all.
export type TestMethodResponse =
	| {
		kind: 'success';
		request: TestMethodSentRequest;
		response: { status: number; headers: Record<string, string>; body: unknown };
		durationMs: number;
	}
	| {
		kind: 'error';
		stage: TestMethodErrorStage;
		message: string;
		request?: TestMethodSentRequest;
	};
