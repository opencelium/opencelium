import { buildWorkflowIndexes } from '../api/connectionPayload';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { formatParsedArgPath } from '../components/request-editor/utils/parseEnhancementArg';
import type { Connection, MethodWithId } from '../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { collectReferenceOccurrences } from './graph.referenceLocations';
import type { ReferenceLocation } from './graph.referenceLocations';
import { referenceKey } from './graph.referenceRemap';
import { findReferencesBrokenByChange } from './graph.brokenReferenceCleanup';
import { normalizeReferenceColor } from './graph.referenceColors';
import { collectWorkflowJumpLinks, isWorkflowReferenceVisible } from './graph.referenceVisibility';

/** A method that could take a doomed one's place. */
export type ReferenceRemapCandidate = {
	nodeId: string;
	color: string;
	label: string;
};

/** One field of a doomed method that something actually reads. The unit a remap
 *  applies to: two steps reading the same field get one row, because the
 *  reference they hold is one string and there is one answer to give about it. */
export type ReferenceRemapSource = {
	/** The whole reference as stored, normalized — the key an override is
	 *  recorded under. */
	key: string;
	/** 'body' | 'header' | 'status', the half of the reference a path picker
	 *  cannot change: a body field can only be replaced by a body field. */
	messageProperty: string;
	path: string;
	/** How the field reads in the dialog, e.g. `body.$.items[0].id`. */
	label: string;
	/** Where this reference sits — the field of the reading step it fills, or
	 *  the part of it that has no field to name. One reference string can be
	 *  held in several places at once; re-pointing it moves all of them, so they
	 *  are listed rather than split into rows that could not be answered apart. */
	locations: ReferenceLocation[];
	/** The steps holding *this* reference. Scope is decided here rather than at
	 *  the method above: a field read by one step can be re-pointed at anything
	 *  that step can see, whatever the method's other readers can reach. */
	consumerNodeIds: string[];
	/** What this field may be read from — visible to every step in
	 *  `consumerNodeIds`. Empty means it can only be cleared. */
	candidates: ReferenceRemapCandidate[];
};

/** One method that is going away, and everything a user needs to decide what
 *  should be read in its place. */
export type ReferenceRemapTarget = {
	/** The colour every reference names it by — what a remap substitutes. */
	color: string;
	label: string;
	/** The steps that read it and would lose the reference. */
	consumerNodeIds: string[];
	/** The fields of it that are read, each with its own scope and its own
	 *  answer. */
	sources: ReferenceRemapSource[];
	/** Everything at least one of those fields could be read from — the union of
	 *  the sources' own lists, so the method-wide shortcut hides nothing a field
	 *  could have offered. A choice from it is applied only where it is legal;
	 *  see buildRemapPlan. Empty means every field can only be cleared. */
	candidates: ReferenceRemapCandidate[];
};

type GraphState = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
};

type MethodIdentity = ReferenceRemapCandidate;

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
		}))
		.filter((identity) => !!identity.color);


/**
 * Which fields of the doomed methods are actually read, by whom, and where —
 * gathered from the graph as it will be, so what is left is exactly the
 * references that outlive the change and need an answer.
 *
 * Attribution matters as much as the reference itself: a field's scope is the
 * scope of the steps holding it, and where it sits is what tells the user which
 * of their own fields is about to change.
 *
 * Response references only: a `.(request)` reference names the field a binding
 * *fills*, which is the consumer's own and is not what a replacement changes.
 */
const collectSources = (
	nodes: WorkflowNodeModel[],
	fieldBindings: unknown[] | undefined,
	doomedColors: Set<string>,
) => {
	const byColor = new Map<string, Map<string, ReferenceRemapSource>>();
	collectReferenceOccurrences(nodes, fieldBindings).forEach(
		({ parsed, consumerNodeId, location }) => {
			if (parsed.direction !== 'response') return;
			const color = normalizeReferenceColor(parsed.color);
			if (!doomedColors.has(color)) return;
			const key = referenceKey(parsed);
			const sources = byColor.get(color) ?? new Map<string, ReferenceRemapSource>();
			const source = sources.get(key) ?? {
				key,
				messageProperty: parsed.messageProperty,
				path: parsed.path,
				label: formatParsedArgPath(parsed),
				consumerNodeIds: [],
				locations: [],
				candidates: [],
			};
			if (!source.consumerNodeIds.includes(consumerNodeId)) {
				source.consumerNodeIds.push(consumerNodeId);
			}
			if (!source.locations.some((held) => held.kind === location.kind
				&& held.value === location.value)) {
				source.locations.push(location);
			}
			sources.set(key, source);
			byColor.set(color, sources);
		});
	return byColor;
};

/**
 * What a structural change is about to take away, framed as a choice rather than
 * a loss: every method whose references the change breaks, with the methods that
 * could be read instead.
 *
 * Scope is decided per field, not per method: a candidate has to be readable by
 * every step holding *that* reference, since the reference is one string they
 * share and re-pointing it moves all of them at once. Deciding it per method
 * instead would have hidden, from a field read by one step, everything only that
 * step can see — the method's other readers have no say in a reference they do
 * not hold. The method's own list is then the union of its fields', so the
 * shortcut above them offers everything at least one field could take.
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

	const readableBy = (consumerNodeIds: string[]) =>
		survivors.filter((candidate) => consumerNodeIds.every((consumerNodeId) =>
			candidate.nodeId !== consumerNodeId
			&& isWorkflowReferenceVisible(indexes.get(candidate.nodeId),
				indexes.get(consumerNodeId), jumps)));

	return [...consumersByColor.entries()].map(([color, consumerNodeIds]) => {
		const sources = [...(sourcesByColor.get(color)?.values() ?? [])]
			.map((source) => ({ ...source, candidates: readableBy(source.consumerNodeIds) }));
		// Union in the order the graph itself gives, so the shortcut reads like the
		// field lists it is drawn from rather than like a third, unrelated list.
		const seen = new Set<string>();
		const candidates = sources.flatMap((source) => source.candidates)
			.filter((candidate) => !seen.has(candidate.nodeId) && seen.add(candidate.nodeId));
		return {
			color,
			label: labelByColor.get(color) ?? color,
			consumerNodeIds,
			sources,
			// A method whose fields could not be enumerated has none of them to draw
			// a union from; fall back to what all its readers can see, which is what
			// a colour substitution needs anyway.
			candidates: sources.length > 0 ? candidates : readableBy(consumerNodeIds),
		};
	});
};

/**
 * The graph as it will be, in the shape the shared reference generator reads.
 * Built once for a whole dialog: it deserializes every method's request config,
 * which is not something to repeat per field row.
 */
export const buildRemapConnection = (after: GraphState): Connection => {
	const connection = buildLegacyConnection(after.nodes);
	return {
		...connection,
		// Reference visibility is read off the graph's own edges; without them the
		// walk falls back to a flat ordinal that operators make meaningless.
		ui: { ...connection.ui, flowchartEdges: after.edges.map((edge) => ({
			id: String(edge.id), source: String(edge.source), target: String(edge.target),
		})) },
	};
};

/**
 * The same connection cut down to what one field may be read from.
 *
 * The cut is what keeps the generator honest here. Its own eligibility walk
 * answers "what can this one method read", which is the right question in the
 * body editor and the wrong one for a reference two steps share — it would offer
 * a method one of them can see and leave the other holding a reference as broken
 * as the one it replaced. Narrowing the list first means its walk can only
 * narrow further.
 *
 * The consumer method comes back with it: the generator anchors its scope and
 * its loop-iterator suggestions on the method doing the reading.
 */
export const restrictRemapConnection = (
	connection: Connection,
	candidates: ReferenceRemapCandidate[],
	consumerNodeIds: string[],
): { connection: Connection; consumerMethod: MethodWithId } | null => {
	if (candidates.length === 0) return null;
	const consumerMethod = connection.fromConnector.method
		.find((method) => consumerNodeIds.includes(method.id));
	if (!consumerMethod) return null;
	const allowed = new Set(candidates.map((candidate) => candidate.nodeId));
	return {
		consumerMethod,
		connection: {
			...connection,
			fromConnector: {
				...connection.fromConnector,
				method: connection.fromConnector.method.filter((method) =>
					allowed.has(method.id) || method.id === consumerMethod.id),
			},
		},
	};
};
