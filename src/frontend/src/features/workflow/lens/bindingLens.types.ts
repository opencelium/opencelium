import type { Edge, Node } from '@xyflow/react';

export type LensReferenceDirection = 'request' | 'response';

export type LensEndpoint = {
	/** null when no method on the canvas carries this colour, or none is visible
	 *  from the consumer — the reference is still described so the lens can draw
	 *  it as broken instead of dropping it. */
	nodeId: string | null;
	label: string | null;
	color: string;
	direction: LensReferenceDirection;
	messageProperty: string;
	/** '' means the whole message ($) rather than a field inside it. */
	field: string;
	/** Display path, e.g. 'body.$.items[0].name' or 'status'. */
	path: string;
};

export type LensInvalidReason = 'out-of-scope' | 'missing-method';

/**
 * Where the reference behind a binding actually lives. An enhancement is a row in
 * the connection's `fieldBindings` and has an editor of its own; a 'value'
 * reference is written straight into the field it fills (what the body and header
 * pickers produce) and has nothing to edit but the field itself.
 */
export type LensBindingSource =
	| { kind: 'enhancement'; enhanceId: string; varKey: string }
	| { kind: 'value' };

export type LensBinding = {
	/** Stable identity for a lens edge and for drawer selection. */
	key: string;
	source: LensBindingSource;
	consumer: LensEndpoint;
	provider: LensEndpoint;
	/** false for a plain wire (one reference, untouched default script). */
	isScript: boolean;
	invalidReason: LensInvalidReason | null;
	/** Set only for 'out-of-scope': the method the reference names, which does
	 *  exist but cannot be read from the consumer. The lens anchors the broken
	 *  edge on it, so the user sees which method the binding meant. */
	unreadableProviderNodeId: string | null;
};

export type LensBindingGraph = {
	bindings: LensBinding[];
	/** Rows the lens cannot draw, kept as counts so their absence can be stated
	 *  in the UI rather than read as "this method has no bindings". */
	skipped: {
		/** Unparseable RESULT_VAR (drops the binding) or VAR_n (drops the row),
		 *  and enhancements that carry no VAR_n at all. */
		malformed: number;
		/** Target is neither body nor header — endpoint/query-param and operator
		 *  references live on node data, not in fieldBindings. */
		outsideScope: number;
		/** The consumer method is no longer on the canvas. */
		unanchored: number;
	};
};

export type LensEdgeData = {
	/** 'pair' collapses every binding between two methods into one arc; a
	 *  'reference' arc is one binding, drawn once an endpoint is expanded. */
	variant: 'pair' | 'reference';
	/** The provider colour, or the danger colour when every reference is broken. */
	color: string;
	providerLabel: string | null;
	consumerLabel: string | null;
	count: number;
	invalidCount: number;
	hasScript: boolean;
	/** LensBinding.key values behind this edge — the drawer selection in step 4. */
	bindingKeys: string[];
	/** Field paths, on a 'reference' arc only — the two ends it actually joins. */
	sourcePath?: string;
	targetPath?: string;
	isSelected: boolean;
	/** Clicking the arc: expand the pair, or select the single binding it stands
	 *  for (a one-binding pair has nothing to expand into worth the extra click). */
	onActivate?: () => void;
	activates: 'expand' | 'select';
};

export type LensCardRow = {
	/** 'source' — a response field other methods read from this method;
	 *  'target' — a request field of this method that bindings fill. */
	role: 'source' | 'target';
	path: string;
	/** The method at the other end, for the row's caption. */
	counterpartLabel: string | null;
	color: string;
	hasScript: boolean;
	isBroken: boolean;
	isSelected: boolean;
	bindingKeys: string[];
	/** Opens this field's binding in the drawer. Absent when the row stands for
	 *  several *different* enhancements — one response field read by two methods
	 *  is two editors, and the row cannot pick between them; the per-consumer arcs
	 *  it fans out into can. */
	onActivate?: () => void;
};

export type LensCardData = {
	anchorNodeId: string;
	label: string;
	color: string;
	rows: LensCardRow[];
	onCollapse?: () => void;
};

export type LensNodeModel = Node<LensCardData, 'binding-lens-card'>;

export type LensView = {
	/** The method the lens is currently drawing. Nothing is drawn without one:
	 *  every arc at once is unreadable on a real workflow, so the at-rest state
	 *  is the per-node badges and an arc appears only for the method in focus. */
	focusNodeId: string | null;
	expandedNodeIds: readonly string[];
	selectedKey: string | null;
};

/** What a method node's badge states while the lens is open. Counts are distinct
 *  field paths, so they match the rows the node's card shows one-for-one — a
 *  script pulling three references into one target field is one received field,
 *  not three. `broken` counts references rather than fields: it mirrors the
 *  legend's own total, and a field can be broken more than one way. */
export type NodeBindingSummary = {
	receives: number;
	provides: number;
	broken: number;
};

export type LensElements = {
	nodes: LensNodeModel[];
	edges: LensEdgeModel[];
	summary: BindingLensSummary;
};

export type LensEdgeModel = Edge<LensEdgeData, 'binding-lens-edge'>;

export type BindingLensSummary = {
	total: number;
	direct: number;
	script: number;
	invalid: number;
	/** Broken references with no method to anchor on, plus everything
	 *  buildBindingGraph could not describe — drawn nowhere, so stated in the
	 *  legend instead. */
	notShown: number;
};
