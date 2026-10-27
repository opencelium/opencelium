import { describe, expect, it } from 'vitest';
import { diffLines, isUntouchedScript } from './scriptVersions.utils';

const marks = (before: string, after: string) =>
	diffLines(before, after).map((line) => `${{ same: ' ', added: '+', removed: '-' }[line.kind]}${line.text}`);

describe('diffLines', () => {
	it('keeps common lines and puts a replaced line before its replacement', () => {
		expect(marks('var a = 1;\nRESULT_VAR = a;', 'var a = 2;\nRESULT_VAR = a;')).toEqual([
			'-var a = 1;',
			'+var a = 2;',
			' RESULT_VAR = a;',
		]);
	});

	it('marks inserted and deleted lines', () => {
		expect(marks('a\nb\nc', 'a\nx\nc\nd')).toEqual([' a', '-b', '+x', ' c', '+d']);
		expect(marks('a\nb', 'a')).toEqual([' a', '-b']);
	});

	it('reports identical scripts as unchanged', () => {
		expect(diffLines('a\nb', 'a\nb').every((line) => line.kind === 'same')).toBe(true);
	});
});

describe('isUntouchedScript', () => {
	it('treats empty and default scripts as untouched', () => {
		expect(isUntouchedScript('  ')).toBe(true);
		expect(isUntouchedScript('RESULT_VAR = VAR_0;')).toBe(true);
		expect(isUntouchedScript('RESULT_VAR = VAR_0.trim();')).toBe(false);
	});
});
