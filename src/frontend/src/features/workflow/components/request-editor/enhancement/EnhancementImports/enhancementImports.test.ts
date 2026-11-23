import { describe, expect, it } from 'vitest';
import { isImportable } from './enhancementImports.utils';
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
});
