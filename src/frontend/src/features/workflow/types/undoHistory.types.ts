import type { WorkflowEdgeModel, WorkflowNodeModel } from './workflow.types';

/**
 * One in-session canvas state. Nodes/edges are held by reference — every
 * mutation path in the editor replaces them immutably, so an entry costs a few
 * pointers rather than a deep clone.
 *
 * `signature` is the graph reduced to the parts a user actually authored (see
 * `buildWorkflowUndoSignature`). Two states with the same signature are the
 * same edit, which is what keeps selection, measured sizes, hover/drag
 * decorations and test-run flags off the undo stack.
 */
export type WorkflowUndoSnapshot = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	/** Reference/enhancement bindings, kept in step with the graph so undoing a
	 * node deletion also brings back the references that were cleaned with it.
	 * `unknown[]` because the binding shape is still untyped legacy data. */
	fieldBindings: unknown[] | undefined;
	signature: string;
	/** The change that produced this state, for the history menu. */
	change: WorkflowUndoChange;
	/** When the change was recorded (epoch ms). Preserved across the refreshes
	 * that only carry newer object references, so it stays the moment the user
	 * actually made the edit. */
	at: number;
};

/** Which part of a method's request an edit landed in. */
export type WorkflowUndoMethodSection = 'header' | 'body';

/** Which operator kind a condition edit belongs to. */
export type WorkflowUndoOperatorKind = 'if' | 'loop';

/** Which part of an enhancement was touched. `script` covers the script body and
 * its reference arguments — the enhancement's actual behaviour. `multiple` is for
 * a session that changed more than one of them, where naming any single aspect
 * would misreport what happened. */
export type WorkflowUndoEnhancementAspect =
	| 'script' | 'language' | 'description' | 'removed' | 'multiple';

/**
 * Which glyph identifies the node an entry concerns. `connector` carries the
 * connector's own icon so the menu can show the real logo, falling back to the
 * generic connector glyph exactly as MethodConnectorChip does.
 */
export type WorkflowUndoIcon =
	| { kind: 'connector'; iconUrl?: string | null }
	| { kind: 'http-request' }
	| { kind: 'webhook' }
	| { kind: 'if' }
	| { kind: 'loop' };

/**
 * What one undo entry actually changed, derived by diffing it against the entry
 * before it (see describeWorkflowUndoChange) — the observer records state, not
 * intent, so the label is reconstructed rather than reported by a call site.
 * A discriminated union so the menu's renderer stays exhaustive.
 */
export type WorkflowUndoChange = WorkflowUndoChangeKind & {
	/** The node this entry concerns, when there is exactly one. */
	icon?: WorkflowUndoIcon;
};

type WorkflowUndoChangeKind =
	| { kind: 'initial' }
	// `nameKey` names the node by its kind ("HTTP Request", "Webhook") for the
	// types whose own subtitle is unhelpful — a system node's is its HTTP verb.
	| { kind: 'nodes-added'; count: number; name?: string; nameKey?: string }
	| { kind: 'nodes-removed'; count: number; name?: string; nameKey?: string }
	| { kind: 'nodes-moved'; count: number; name?: string; nameKey?: string }
	/** `label` is the new label the node was given. */
	| { kind: 'node-renamed'; label?: string }
	| { kind: 'method-config'; name?: string }
	| { kind: 'method-url'; name?: string }
	| { kind: 'method-header'; name?: string }
	| { kind: 'method-body'; name?: string }
	| { kind: 'method-reference'; section: WorkflowUndoMethodSection;
		operation: 'added' | 'removed' | 'edited'; name?: string }
	| { kind: 'method-enhancement'; section: WorkflowUndoMethodSection;
		aspect: WorkflowUndoEnhancementAspect; name?: string }
	| { kind: 'condition-config'; name?: string }
	| { kind: 'aggregator-config'; operation: 'configured' | 'removed';
		name?: string; nameKey?: string }
	| { kind: 'connector-config'; name?: string }
	| { kind: 'condition-rule'; operator: WorkflowUndoOperatorKind;
		operation: 'added' | 'removed' | 'edited' }
	| { kind: 'condition-group'; operator: WorkflowUndoOperatorKind;
		operation: 'added' | 'removed' | 'edited' }
	/** Several independent edits inside one operator, where naming a single rule
	 * or group would misreport the rest. */
	| { kind: 'operator-edited'; operator: WorkflowUndoOperatorKind }
	| { kind: 'edges-changed' }
	| { kind: 'references' }
	| { kind: 'multiple' };

/** One row of the change-history menu. `offset` is how far this entry is from
 * the current state: negative = that many undos away, 0 = current, positive =
 * that many redos away. Feed it straight back to `jumpTo`. */
export type WorkflowUndoEntry = {
	offset: number;
	change: WorkflowUndoChange;
	/** Epoch ms; see WorkflowUndoSnapshot.at. */
	at: number;
};

export type WorkflowUndoStack = {
	past: WorkflowUndoSnapshot[];
	present: WorkflowUndoSnapshot | null;
	future: WorkflowUndoSnapshot[];
};
