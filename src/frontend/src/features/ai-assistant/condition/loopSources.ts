import { buildReferenceValue } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions';
import type { Connection, MethodWithId } from '@features/workflow/types/connection';
import type { LoopSourceKind } from '../model/aiGateway.types';
import { type LoopArray, loopArraysAround } from '../mapping/mappingCandidates';

/** A value a loop can repeat over: a list, an object's fields, or a text to split; with the reference the picker writes. */
export type LoopSource = { id: string; step: string; system: string; path: string; kind: LoopSourceKind; reference: string };

const MAX_SOURCES = 400;
const MAX_DEPTH = 6;

const joinKey = (path: string, key: string) => (path ? `${path}.${key}` : key);

/**
 * What a response offers a loop. A list is offered whole (`issues[*]`); one a surrounding loop already runs over is
 * entered at that loop's item instead (`issues[i].labels[*]`), and other lists are not entered: a loop over "the first
 * issue's labels" is rarely meant.
 */
function loopablePaths(body: unknown, loops: LoopArray[], color: string): { path: string; kind: LoopSourceKind }[] {
	const found: { path: string; kind: LoopSourceKind }[] = [];
	const visit = (value: unknown, path: string, plainPath: string, depth: number) => {
		if (depth > MAX_DEPTH) return;
		if (Array.isArray(value)) {
			const loop = loops.find((candidate) => candidate.color === color.toUpperCase() && candidate.path === plainPath);
			if (loop) visit(value[0], `${path}[${loop.iterator}]`, plainPath, depth + 1);
			else found.push({ path: `${path}[*]`, kind: 'list' });
			return;
		}
		if (value !== null && typeof value === 'object') {
			if (path) found.push({ path, kind: 'object' });
			Object.entries(value).forEach(([key, child]) => visit(child, joinKey(path, key), joinKey(plainPath, key), depth + 1));
			return;
		}
		if (path && typeof value === 'string') found.push({ path, kind: 'text' });
	};
	visit(body, '', '', 0);
	return found;
}

/** The values a loop at `index` can repeat over, from the steps the dialog offers (`methods`, nearest last). */
export function collectLoopSources(connection: Connection, methods: MethodWithId[], index: string): LoopSource[] {
	const loops = loopArraysAround(connection, index);
	const sources: LoopSource[] = [];
	for (const method of [...methods].reverse()) {
		for (const { path, kind } of loopablePaths(method.response?.success?.body?.fields, loops, method.color)) {
			if (sources.length >= MAX_SOURCES) return sources;
			sources.push({
				id: `s${sources.length + 1}`, step: method.label || method.name, system: method.connector?.title ?? '',
				path, kind, reference: buildReferenceValue(method.color, 'body', path),
			});
		}
	}
	return sources;
}
