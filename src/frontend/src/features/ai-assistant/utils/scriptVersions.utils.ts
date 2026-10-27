import { DEFAULT_ENHANCEMENT_SCRIPT } from '@features/workflow/components/request-editor/body-editor/bodyReference';

export type ScriptSnapshot = { script: string; description: string };

export type DiffLine = { kind: 'same' | 'added' | 'removed'; text: string };

// Above this many line pairs the LCS table gets slow; a script that large is shown as fully replaced.
const MAX_DIFF_CELLS = 250_000;

export function isUntouchedScript(script: string): boolean {
	const trimmed = script.trim().replace(/;$/, '');
	return trimmed === '' || trimmed === DEFAULT_ENHANCEMENT_SCRIPT;
}

/** Line diff of two scripts (longest common subsequence), removed lines before the added ones that replace them. */
export function diffLines(before: string, after: string): DiffLine[] {
	const left = before.split('\n');
	const right = after.split('\n');
	if (left.length * right.length > MAX_DIFF_CELLS) {
		return [
			...left.map((text): DiffLine => ({ kind: 'removed', text })),
			...right.map((text): DiffLine => ({ kind: 'added', text })),
		];
	}
	const width = right.length + 1;
	const common = new Array<number>((left.length + 1) * width).fill(0);
	const at = (row: number, column: number) => common[row * width + column] ?? 0;
	for (let row = left.length - 1; row >= 0; row--) {
		for (let column = right.length - 1; column >= 0; column--) {
			common[row * width + column] =
				left[row] === right[column]
					? at(row + 1, column + 1) + 1
					: Math.max(at(row + 1, column), at(row, column + 1));
		}
	}
	const lines: DiffLine[] = [];
	let row = 0;
	let column = 0;
	while (row < left.length || column < right.length) {
		if (row < left.length && column < right.length && left[row] === right[column]) {
			lines.push({ kind: 'same', text: left[row] ?? '' });
			row++;
			column++;
		} else if (column < right.length && (row === left.length || at(row, column + 1) > at(row + 1, column))) {
			lines.push({ kind: 'added', text: right[column] ?? '' });
			column++;
		} else {
			lines.push({ kind: 'removed', text: left[row] ?? '' });
			row++;
		}
	}
	return lines;
}
