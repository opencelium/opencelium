import type { ParsedArg } from '../components/request-editor/utils/parseEnhancementArg';
import { parseEnhancementArg } from '../components/request-editor/utils/parseEnhancementArg';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { collectParsedReferences } from './graph.referenceOccurrences';
import { normalizeReferenceColor } from './graph.referenceColors';

/**
 * Where a reference sits in the step that holds it.
 *
 * A field of a method's request is a reference in its own right — the same
 * `#colour.(request).body.$.path` an enhancement writes into its RESULT_VAR —
 * so it can be shown the way references are shown everywhere else. The rest of
 * a request has no such address: a value spliced into the URL or a term in an
 * operator's condition is somewhere in a string, and can only be named.
 */
export type ReferenceLocation =
	| { kind: 'reference'; value: string }
	| { kind: 'label'; value: string }
	/** An operator's condition, which can hold the same reference in any number
	 *  of its rules — so it carries the node, and the rules are read from it
	 *  where the dialog can show which ones. */
	| { kind: 'operator'; value: string; nodeId: string };

export type ReferenceOccurrence = {
	parsed: ParsedArg;
	/** The step holding it. */
	consumerNodeId: string;
	location: ReferenceLocation;
};

const isMethodNode = (node: WorkflowNodeModel) =>
	node.type === 'connector' || node.type === 'system' || node.type === 'trigger-connection';

/** `body.$.items[0].name` from the walk that found the value. */
const joinPath = (segments: string[]) => segments.reduce((path, segment) =>
	(segment.startsWith('[') ? `${path}${segment}` : path ? `${path}.${segment}` : segment), '');

const requestReference = (consumerColor: string, part: string, segments: string[]) => {
	const path = joinPath(segments);
	return `${consumerColor}.(request).${part}.$${path ? `.${path}` : ''}`;
};

/** Every string leaf of a request part, with the path it was found at. */
const walkLeaves = (value: unknown, segments: string[] = []): { segments: string[];
	value: string }[] => {
	if (typeof value === 'string') return [{ segments, value }];
	if (Array.isArray(value)) {
		return value.flatMap((item, index) => walkLeaves(item, [...segments, `[${index}]`]));
	}
	if (value && typeof value === 'object') {
		return Object.entries(value as Record<string, unknown>)
			.flatMap(([key, nested]) => walkLeaves(nested, [...segments, key]));
	}
	return [];
};

const methodOccurrences = (node: WorkflowNodeModel): ReferenceOccurrence[] => {
	const color = normalizeReferenceColor(node.data.color);
	const config = node.data.methodConfig as Record<string, unknown> | undefined;
	if (!config) return [];
	const addressable = [
		...walkLeaves(config.body).map((leaf) => ({ ...leaf, part: 'body' })),
		...walkLeaves(config.headers).map((leaf) => ({ ...leaf, part: 'header' })),
	].flatMap(({ segments, value, part }) => collectParsedReferences(value).map((parsed) => ({
		parsed,
		consumerNodeId: node.id,
		location: color
			? { kind: 'reference' as const, value: requestReference(color, part, segments) }
			: { kind: 'label' as const, value: part },
	})));

	// The URL and its arguments are spliced into a string, so there is no field
	// to name — only the part of the request the value ends up in.
	const inUrl = [config.url, config.queryParams, config.endpointArgs]
		.flatMap((value) => collectParsedReferences(value))
		.map((parsed) => ({
			parsed, consumerNodeId: node.id, location: { kind: 'label' as const, value: 'url' },
		}));

	return [...addressable, ...inUrl];
};

const operatorOccurrences = (node: WorkflowNodeModel): ReferenceOccurrence[] =>
	collectParsedReferences(node.data.conditionConfig).map((parsed) => ({
		parsed,
		consumerNodeId: node.id,
		location: { kind: 'operator', value: node.data.title || String(node.type ?? ''),
			nodeId: node.id },
	}));

/**
 * Every reference on the graph, with the step holding it and where in that step
 * it sits — the half `collectParsedReferences` leaves out, and the only way to
 * tell a user *which* of a method's fields will change when a reference is
 * re-pointed.
 *
 * An enhancement says where it lands itself: RESULT_VAR is the request-side
 * reference of the field it fills, which is exactly this address.
 */
export const collectReferenceOccurrences = (
	nodes: WorkflowNodeModel[],
	fieldBindings: unknown[] | undefined,
): ReferenceOccurrence[] => {
	const nodeByColor = new Map(nodes
		.map((node) => [normalizeReferenceColor(node.data.color), node] as const)
		.filter(([color]) => !!color));

	const fromNodes = nodes.flatMap((node) => {
		if (isMethodNode(node)) return methodOccurrences(node);
		if (node.type === 'if' || node.type === 'loop') return operatorOccurrences(node);
		return [];
	});

	const fromBindings = (Array.isArray(fieldBindings) ? fieldBindings : [])
		.flatMap((binding) => {
			const args = (binding as { enhancement?: { args?: Record<string, unknown> } })
				?.enhancement?.args ?? {};
			const resultVar = typeof args.RESULT_VAR === 'string' ? args.RESULT_VAR : '';
			const target = resultVar ? parseEnhancementArg(resultVar) : null;
			const consumer = target ? nodeByColor.get(normalizeReferenceColor(target.color)) : undefined;
			if (!consumer) return [];
			return Object.entries(args)
				.filter(([key]) => key !== 'RESULT_VAR')
				.flatMap(([, value]) => collectParsedReferences(value))
				.map((parsed) => ({
					parsed,
					consumerNodeId: consumer.id,
					location: { kind: 'reference' as const, value: resultVar },
				}));
		});

	return [...fromNodes, ...fromBindings];
};
