import { buildReferenceValue } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions';
import type { Connection, MethodWithId } from '@features/workflow/types/connection';
import { getEligibleReferenceMethods } from '@features/workflow/utils/referenceMethodVisibility';

/** A value an earlier step supplies, as the reference the body editor would write for it. */
export type MappingSource = { id: string; methodId: string; step: string; system: string; path: string; reference: string };

/** A leaf of the step's request body: where it is (react-json-view's namespace + name) and what it holds now. */
export type MappingTarget = { path: string; namespace: string[]; name: string; current: string };

/** A loop around the step, by the array it runs over: `for {%#FFCFB5.(response).body.$.result[*]%}`. */
type LoopArray = { color: string; path: string; iterator: string };

const MAX_SOURCES = 400;
const MAX_DEPTH = 6;
const LOOP_EXPRESSION_RE = /(#[0-9A-Fa-f]{6})\.\(response\)\.body\.\$\.?([^%}\s]*)/;

const normalizeArrayPath = (path: string) => path.replace(/\[[^\]]*\]$/, '').replace(/\[[^\]]*\]/g, '').replace(/^\.+|\.+$/g, '');

const isAncestor = (parent: string, child: string) => child.startsWith(`${parent}_`);

function loopArraysAround(connection: Connection, index: string): LoopArray[] {
	return connection.fromConnector.operator.flatMap((operator): LoopArray[] => {
		if (operator.type !== 'loop' || !isAncestor(operator.index, index)) return [];
		const match = LOOP_EXPRESSION_RE.exec(operator.expression ?? '');
		return match?.[1] ? [{ color: match[1].toUpperCase(), path: normalizeArrayPath(match[2] ?? ''), iterator: operator.iterator }] : [];
	});
}

const joinKey = (path: string, key: string) => (path ? `${path}.${key}` : key);

/**
 * The response's leaves as paths. An array a loop around the step runs over is read at the loop's current element
 * (`result[i].title`); any other array at its first element, which is what a single value from it means.
 */
function leafPaths(body: unknown, loops: LoopArray[], color: string): string[] {
	const paths: string[] = [];
	const visit = (value: unknown, path: string, plainPath: string, depth: number) => {
		if (depth > MAX_DEPTH) return;
		if (Array.isArray(value)) {
			const loop = loops.find((candidate) => candidate.color === color.toUpperCase() && candidate.path === plainPath);
			visit(value[0], `${path}[${loop?.iterator ?? 0}]`, plainPath, depth + 1);
			return;
		}
		if (value !== null && typeof value === 'object') {
			Object.entries(value).forEach(([key, child]) => visit(child, joinKey(path, key), joinKey(plainPath, key), depth + 1));
			return;
		}
		if (path) paths.push(path);
	};
	visit(body, '', '', 0);
	return paths;
}

/** Every value the earlier steps the editor allows can supply to `method`, nearest first. */
export function collectMappingSources(connection: Connection, method: MethodWithId): MappingSource[] {
	const loops = loopArraysAround(connection, method.index);
	const sources: MappingSource[] = [];
	const methods = [...getEligibleReferenceMethods(connection, method)].reverse();
	for (const source of methods) {
		for (const path of leafPaths(source.response?.success?.body?.fields, loops, source.color)) {
			if (sources.length >= MAX_SOURCES) return sources;
			sources.push({
				id: `s${sources.length + 1}`, methodId: source.id, step: source.label || source.name,
				system: source.connector?.title ?? '', path, reference: buildReferenceValue(source.color, 'body', path),
			});
		}
	}
	return sources;
}

const asText = (value: unknown) => (typeof value === 'string' ? value : value === null || value === undefined ? '' : JSON.stringify(value));

/** The body's leaves; an array's elements are addressed by index, as the JSON editor does. */
export function collectMappingTargets(body: unknown): MappingTarget[] {
	const targets: MappingTarget[] = [];
	const visit = (value: unknown, namespace: string[], name: string, path: string) => {
		if (Array.isArray(value) && value.length > 0) {
			value.forEach((item, index) => visit(item, name ? [...namespace, name] : namespace, String(index), `${path}[${index}]`));
			return;
		}
		if (value !== null && typeof value === 'object' && Object.keys(value).length > 0) {
			Object.entries(value).forEach(([key, child]) => visit(child, name ? [...namespace, name] : namespace, key, joinKey(path, key)));
			return;
		}
		if (name) targets.push({ path, namespace, name, current: asText(value) });
	};
	visit(body, [], '', '');
	return targets;
}

/** The body with `value` at a target's place; the input is left untouched. */
export function setTargetValue(body: unknown, target: MappingTarget, value: string): unknown {
	const copy = structuredClone(body ?? {}) as Record<string, unknown>;
	let node: Record<string, unknown> = copy;
	for (const key of target.namespace) {
		const next = node[key];
		node = (next !== null && typeof next === 'object' ? next : (node[key] = {})) as Record<string, unknown>;
	}
	node[target.name] = value;
	return copy;
}
