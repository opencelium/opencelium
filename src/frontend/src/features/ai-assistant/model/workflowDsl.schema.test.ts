import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Relative to the frontend root, where vitest runs.
const FRONTEND_COPY = 'src/features/ai-assistant/model/workflowDsl.schema.ts';
const GATEWAY_SOURCE = '../ai-gateway/src/dsl/workflowDsl.schema.ts';

describe('workflowDsl.schema.ts', () => {
	it.runIf(existsSync(GATEWAY_SOURCE))('is a verbatim copy of the AI gateway schema', () => {
		expect(readFileSync(FRONTEND_COPY, 'utf8')).toBe(readFileSync(GATEWAY_SOURCE, 'utf8'));
	});
});
