import { describe, expect, it } from 'vitest';
import { initialGlobalInput, scriptFunctionSource, toPlaygroundGlobal, withScriptImports } from './playgroundGlobals';

const audit = { scope: { type: 'ALL' as const, categories: [], workflows: [] }, ownerUser: null, myPermissions: [], version: 1,
	createdAt: '', createdBy: null, updatedAt: null, updatedBy: null, description: '' };

describe('playground globals', () => {
	it('turns a script import into a hoisted function with its defaults', () => {
		const global = toPlaygroundGlobal('formatDate', {
			...audit, id: 3, name: 'formatDate', kind: 'SCRIPT',
			script: { language: 'js', code: 'return date + pattern;', parameters: [
				{ name: 'date', required: true, default: null }, { name: 'pattern', required: false, default: 'dd.MM' },
			] },
		});
		expect(global.kind).toBe('script');
		if (global.kind !== 'script') return;
		expect(scriptFunctionSource(global)).toBe(
			'function formatDate(date, pattern) {\nif (pattern === undefined) pattern = "dd.MM";\nreturn date + pattern;\n}');
		expect(withScriptImports('RESULT_VAR = formatDate(VAR_0);', [global]).split('\n')[0]).toBe('RESULT_VAR = formatDate(VAR_0);');
	});

	it('prefills a value import with its current value, and a secret with nothing', () => {
		const mutable = toPlaygroundGlobal('lastSync', {
			...audit, id: 4, name: 'lastSync', kind: 'MUTABLE', value: null,
			mutable: { currentValue: 5, revision: 1, setAt: null, setBy: null, setByExecutionId: null, busyPolicy: 'QUEUE', ownerWorkflow: null },
		});
		const secret = toPlaygroundGlobal('apiKey', { ...audit, id: 5, name: 'apiKey', kind: 'CONSTANT', value: null, secret: true, hasValue: true });
		expect(mutable.kind === 'value' && initialGlobalInput(mutable)).toEqual({ mode: 'json', text: '5' });
		expect(secret.kind === 'value' && initialGlobalInput(secret)).toEqual({ mode: 'json', text: '' });
		expect(toPlaygroundGlobal('gone', null)).toEqual({ kind: 'unavailable', name: 'gone' });
	});
});
