import { buildWorkflowIndexes } from '../api/connectionPayload';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { formatParsedArgPath } from '../components/request-editor/utils/parseEnhancementArg';
import type { MethodWithId } from '../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { collectParsedReferences } from './graph.referenceOccurrences';
import { referenceKey } from './graph.referenceRemap';
import { findReferencesBrokenByChange } from './graph.brokenReferenceCleanup';
import { normalizeReferenceColor } from './graph.referenceColors';
import { collectWorkflowJumpLinks, isWorkflowReferenceVisible } from './graph.referenceVisibility';

/** A method that could take a doomed one's place. Carries the legacy method
 *  itself, because the field picker reads its stored response to offer paths. */
export type ReferenceRemapCandidate = {
	nodeId: string;
	color: string;
	label: string;
	method: MethodWithId;
};

/** One field of a doomed method that something actually reads. The unit a path
 *  choice applies to: two steps reading the same field get one row, because
 *  there is one answer to give about it. */
export type ReferenceRemapSource = {
	/** The whole reference as stored, normalized — the key a path override is
	 *  recorded under. */
	key: string;
	/** 'body' | 'header' | 'status', the half of the reference a path picker
	 *  cannot change: a body field can only be replaced by a body field. */
	messageProperty: string;
	path: string;
	/** How the field reads in the dialog, e.g. `body.$.items[0].id`. */
	label: string;
};

/** One method that is going away, and everything a user needs to decide what
 *  should be read in its place. */
export type ReferenceRemapTarget = {
	/** The colour every reference names it by — what a remap substitutes. */
	color: string;
	label: string;
	/** The steps that read it and would lose the reference. */
	consumerNodeIds: string[];
	/** The fields of it that are read, each of which can be re-pointed on its
	 *  own once a replacement method is chosen. */
	sources: ReferenceRemapSource[];
	/** Empty when nothing on the smaller graph can be read by every one of those
	 *  steps: there is no offer to make and clearing is the only outcome. */
	candidates: ReferenceRemapCandidate[];
};

type GraphState = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
};

type MethodIdentity = { nodeId: string; color: string; label: string; method: MethodWithId };

/* Colour and name as a *reference* knows them, which is not always what the node
   carries: a method with no authored colour is assigned one when the legacy
   connection is built, and that assignment is what the stored references were
   written against. */
const methodIdentities = (nodes: WorkflowNodeModel[]): MethodIdentity[] =>
	buildLegacyConnection(nodes).fromConnector.method
		.filter((method) => nodes.some((node) => node.id === method.id))
		.map((method) => ({
			nodeId: method.id,
			color: normalizeReferenceColor(method.color),
			label: method.name,
			method,
		}))
		.filter((identity) => !!identity.color);


/**
 * Which fields of the doomed methods are actually read, gathered from the graph
 * as it will be — the deleted step is already gone from it, so what is left is
 * exactly the references that outlive it and need an answer.
 *
 * Response references only: a `.(request)` reference names the field a binding
 * *fills*, which is the consumer's own and is not what a replacement changes.
 */
const collectSources = (
	nodes: WorkflowNodeModel[],
	fieldBindings: unknown[] | undefined,
	doomedColors: Set<string>,
) => {
	const byColor = new Map<string, ReferenceRemapSource[]>();
	const seen = new Set<string>();
	[...nodes.map((node) => node.data), ...(Array.isArray(fieldBindings) ? fieldBindings : [])]
		.flatMap((value) => collectParsedReferences(value))
		.forEach((parsed) => {
			if (parsed.direction !== 'response') return;
			const color = normalizeReferenceColor(parsed.color);
			if (!doomedColors.has(color)) return;
			const key = referenceKey(parsed);
			if (seen.has(key)) return;
			seen.add(key);
			byColor.set(color, [...(byColor.get(color) ?? []), {
				key,
				messageProperty: parsed.messageProperty,
				path: parsed.path,
				label: formatParsedArgPath(parsed),
			}]);
		});
	return byColor;
};

/**
 * What a structural change is about to take away, framed as a choice rather than
 * a loss: every method whose references the change breaks, with the methods that
 * could be read instead.
 *
 * A candidate has to be readable by *every* step that reads the doomed method,
 * not merely by one of them — a remap rewrites one colour everywhere at once, so
 * a method visible to two consumers out of three would leave the third holding a
 * reference as broken as the one it replaced. Where that leaves nothing to
 * offer, `candidates` is empty and the caller has only the old behaviour to fall
 * back on.
 *
 * Both graphs are needed: `after` decides what is broken and what is still
 * there, `before` is where a method that is now gone can still be named.
 */
export const buildReferenceRemapTargets = (
	before: GraphState,
	after: GraphState,
	fieldBindings?: unknown[],
): ReferenceRemapTarget[] => {
	const broken = findReferencesBrokenByChange(after.nodes, after.edges, fieldBindings, before);
	if (broken.length === 0) return [];

	const consumersByColor = new Map<string, string[]>();
	broken.forEach(({ sourceColor, consumerNodeId }) => {
		const color = normalizeReferenceColor(sourceColor);
		const consumers = consumersByColor.get(color) ?? [];
		if (!consumers.includes(consumerNodeId)) consumers.push(consumerNodeId);
		consumersByColor.set(color, consumers);
	});

	const labelByColor = new Map(methodIdentities(before.nodes)
		.map((identity) => [identity.color, identity.label]));
	const indexes = buildWorkflowIndexes(after.nodes, after.edges);
	const jumps = collectWorkflowJumpLinks(after.nodes, indexes);
	const survivors = methodIdentities(after.nodes)
		.filter((identity) => !consumersByColor.has(identity.color));

	const sourcesByColor = collectSources(after.nodes, fieldBindings,
		new Set(consumersByColor.keys()));

	return [...consumersByColor.entries()].map(([color, consumerNodeIds]) => ({
		color,
		label: labelByColor.get(color) ?? color,
		consumerNodeIds,
		sources: sourcesByColor.get(color) ?? [],
		candidates: survivors.filter((candidate) => consumerNodeIds.every((consumerNodeId) =>
			candidate.nodeId !== consumerNodeId
			&& isWorkflowReferenceVisible(indexes.get(candidate.nodeId),
				indexes.get(consumerNodeId), jumps))),
	}));
};
