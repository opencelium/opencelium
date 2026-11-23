import { describe, expect, it } from 'vitest';
import { argNamesOf, callOf, isImportable, parameterNotes } from './enhancementImports.utils';
import type { PickerItem } from '@entities/globalVariable/model/types';

const script = (language: 'js' | 'python3'): PickerItem => ({
	kind: 'SCRIPT', name: 's', description: '', language, parameters: [],
});

describe('enhancement imports', () => {
	it('offers scripts of the same language and any value', () => {
		expect(isImportable(script('js'), 'js')).toBe(true);
		expect(isImportable(script('python3'), 'js')).toBe(false);
		expect(isImportable({ kind: 'CONSTANT', name: 'c', description: '', secret: false, valuePreview: '1' }, 'ruby')).toBe(true);
	});

	it('calls a script with the transformation args, not its parameter names', () => {
		const formatDate: PickerItem = {
			kind: 'SCRIPT', name: 'formatDate', description: '', language: 'js', parameters: [
				{ name: 'date', required: true, default: null, description: 'ISO date text' },
				{ name: 'pattern', required: false, default: 'dd.MM.yyyy' },
			],
		};
		expect(callOf(formatDate, ['VAR_0', 'VAR_1'])).toEqual({ text: 'formatDate(VAR_0)', selection: { start: 11, end: 16 } });
		expect(callOf(formatDate, [])).toEqual({ text: 'formatDate(null)', selection: { start: 11, end: 15 } });
		expect(callOf({ kind: 'CONSTANT', name: 'url', description: '', secret: false, valuePreview: null }, ['VAR_0'])).toEqual({ text: 'url' });
		const t = (key: string, options?: Record<string, unknown>) => `${key.split('.').pop()}:${options?.name}`;
		expect(parameterNotes(formatDate, t)).toEqual(['1. requiredParameter:date: ISO date text', '2. optionalParameter:pattern']);
	});

	it('orders the enhancement args numerically', () => {
		expect(argNamesOf({ RESULT_VAR: 'x', VAR_10: 'a', VAR_2: 'b', url: '{{global.url}}' })).toEqual(['VAR_2', 'VAR_10']);
	});
});
