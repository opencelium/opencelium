import { describe, expect, it } from 'vitest';
import { type Enhancement, Language } from '../types/connection';
import { NOT_EXIST_ARG, dropEnhancementArgs, hasEnhancementArgs } from './enhancementArgs';

const enhancement = (script: string, args: Record<string, string>): Enhancement =>
	({ enhanceId: 'en-1', language: Language.JavaScript, script, args });

describe('dropEnhancementArgs', () => {
	it('drops the argument and marks where the script used it', () => {
		const next = dropEnhancementArgs(enhancement('RESULT_VAR = VAR_0 + VAR_1', {
			RESULT_VAR: '#f5a623.(request).body.$.total',
			VAR_0: '#3fa9f5.(response).body.$.net',
			VAR_1: '#7ed321.(response).body.$.tax',
		}), ['VAR_1']);
		expect(next.script).toBe(`RESULT_VAR = VAR_0 + ${NOT_EXIST_ARG}`);
		expect(Object.keys(next.args)).toEqual(['RESULT_VAR', 'VAR_0']);
	});

	it('does not mistake VAR_1 for part of VAR_10', () => {
		const next = dropEnhancementArgs(enhancement('RESULT_VAR = VAR_1 + VAR_10', {
			RESULT_VAR: 'x', VAR_1: 'a', VAR_10: 'b',
		}), ['VAR_1']);
		expect(next.script).toBe(`RESULT_VAR = ${NOT_EXIST_ARG} + VAR_10`);
		expect(Object.keys(next.args)).toEqual(['RESULT_VAR', 'VAR_10']);
	});

	it('leaves a script that never used the argument alone', () => {
		const next = dropEnhancementArgs(enhancement('RESULT_VAR = VAR_0', {
			RESULT_VAR: 'x', VAR_0: 'a', VAR_1: 'b',
		}), ['VAR_1']);
		expect(next.script).toBe('RESULT_VAR = VAR_0');
		expect(Object.keys(next.args)).toEqual(['RESULT_VAR', 'VAR_0']);
	});

	it('never drops RESULT_VAR, and returns the same object when nothing matches', () => {
		const original = enhancement('RESULT_VAR = VAR_0', { RESULT_VAR: 'x', VAR_0: 'a' });
		expect(dropEnhancementArgs(original, ['RESULT_VAR', 'VAR_9'])).toBe(original);
	});
});

describe('hasEnhancementArgs', () => {
	it('is false once every VAR_n is gone', () => {
		expect(hasEnhancementArgs({ args: { RESULT_VAR: 'x' } })).toBe(false);
		expect(hasEnhancementArgs({ args: { RESULT_VAR: 'x', VAR_0: 'a' } })).toBe(true);
	});
});
