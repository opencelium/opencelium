import { expect, it } from 'vitest';
import type { DetailedMethodLog } from '@features/logs';
import type { PlaygroundRequest } from './playground.types';
import { addRecordedEnhancementOutputs } from './recordedEnhancementOutputs';

const signal = new AbortController().signal;
const binding = {
	enhancement: { language: 'js', expertCode: 'RESULT_VAR = VAR_0;' },
	from: [{ color: '#abcdef', type: 'response', field: 'body.$.item' }],
	to: [
		{ color: '#112233', type: 'request', field: 'body.$.item' },
		{ color: '#112233', type: 'request', field: 'header.$.X-Value' },
	],
};
const log = { segment: { request: { payload: '{"item":{"id":"three"}}', header: '{"X-Value":["three"]}' } } } as DetailedMethodLog;

it('restores typed enhancement outputs from the original request', async () => {
	const input = { fieldBindings: [binding], references: [] } as unknown as PlaygroundRequest;
	expect(await addRecordedEnhancementOutputs(input, log, signal)).toBe(true);
	expect(input.enhancementOutputs?.map(({ value }) => value)).toEqual([{ id: 'three' }, 'three']);
});

it('does not substitute a stale result after a script input was edited', async () => {
	const input = {
		fieldBindings: [binding],
		references: [{ reference: '#abcdef.(response).body.$.item', value: 'four', isOverridden: true }],
	} as PlaygroundRequest;
	expect(await addRecordedEnhancementOutputs(input, log, signal, async () => ({ kind: 'timeout' }))).toBe(false);
	expect(input.references).toHaveLength(1);
});

it('uses the recalculated result after an input is edited', async () => {
	const input = {
		fieldBindings: [binding],
		references: [{ reference: '#abcdef.(response).body.$.item', value: 'four', isOverridden: true }],
	} as PlaygroundRequest;
	const run: NonNullable<Parameters<typeof addRecordedEnhancementOutputs>[3]> = async ({ args }) => {
		expect(args).toEqual({ VAR_0: 'four' });
		return { kind: 'value', value: 'four', serverType: 'String', console: [] };
	};
	expect(await addRecordedEnhancementOutputs(input, log, signal, run)).toBe(true);
	expect(input.enhancementOutputs?.map(({ value }) => value)).toEqual(['four', 'four']);
});
