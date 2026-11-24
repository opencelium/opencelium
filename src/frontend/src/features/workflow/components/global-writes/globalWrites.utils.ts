import type { WorkflowGlobalWrites } from '../../types/workflow.types';

export type GlobalWriteRow = { key: string; variable?: string; value: string };

const PREFIX = 'global.';
let nextKey = 0;
export const newRowKey = () => `write-${nextKey++}`;

export const toRows = (writes: WorkflowGlobalWrites | undefined): GlobalWriteRow[] =>
	Object.entries(writes ?? {}).map(([target, value]) => ({
		key: newRowKey(),
		variable: target.startsWith(PREFIX) ? target.slice(PREFIX.length) : target,
		value,
	}));

/** Rows still being filled in are dropped; the backend reads a value it can't resolve as JSON or plain text. */
export const toGlobalWrites = (rows: GlobalWriteRow[]): WorkflowGlobalWrites =>
	Object.fromEntries(rows
		.filter((row) => row.variable && row.value.trim() !== '')
		.map((row) => [`${PREFIX}${row.variable}`, row.value.trim()]));

export const isRowIncomplete = (row: GlobalWriteRow) => !row.variable || row.value.trim() === '';
