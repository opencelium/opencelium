import { buildWorkflowIndexes } from '../api/connectionPayload.indexes';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

export type ReferenceViolationCode =
	| 'UNKNOWN_VARIABLE'
	| 'OUT_OF_SCOPE'
	| 'SCOPE_NOT_ALL'
	| 'NO_USE_PERMISSION'
	| 'INVALID_WRITE_TARGET'
	| 'NOT_MUTABLE'
	| 'NOT_OWNER'
	| 'SCRIPT_NOT_CALLABLE'
	| 'IMPORT_LANGUAGE_MISMATCH';

export type ReferenceViolation = {
	code: string;
	message: string;
	variable?: string;
	ref?: string;
	color?: string;
	index?: string;
	field?: string;
};

export type ReferenceProblem = {
	nodeId?: string;
	messageKey: string;
	messageParams: Record<string, string>;
	/** The backend's own sentence, for a code this frontend has no copy for yet. */
	fallback: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const readString = (record: Record<string, unknown>, key: string) =>
	typeof record[key] === 'string' ? (record[key] as string) : undefined;

/** The 400 the backend sends when a save holds global references it can't accept (contract §10). */
export function readReferenceViolations(body: unknown): ReferenceViolation[] | null {
	if (!isRecord(body) || body.error !== 'GLOBAL_REFERENCE_INVALID' || !Array.isArray(body.violations)) return null;
	return body.violations.filter(isRecord).map((violation) => ({
		code: readString(violation, 'code') ?? 'UNKNOWN',
		message: readString(violation, 'message') ?? '',
		variable: readString(violation, 'variable'),
		ref: readString(violation, 'ref'),
		color: readString(violation, 'color'),
		index: readString(violation, 'index'),
		field: readString(violation, 'field'),
	}));
}

const normalizeColor = (color?: string) => color?.replace('#', '').toLowerCase();

// The tree-path index names methods and operators alike; the colour is a fallback for a
// method whose position changed since the save was sent.
export function findViolationNodeId(nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[],
	violation: Pick<ReferenceViolation, 'index' | 'color'>): string | undefined {
	if (violation.index) {
		for (const [nodeId, index] of buildWorkflowIndexes(nodes, edges)) {
			if (index === violation.index) return nodeId;
		}
	}
	const color = normalizeColor(violation.color);
	return color ? nodes.find((node) => normalizeColor(node.data.color) === color)?.id : undefined;
}

export const toReferenceProblems = (violations: ReferenceViolation[], nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[]): ReferenceProblem[] => violations.map((violation) => ({
	nodeId: findViolationNodeId(nodes, edges, violation),
	messageKey: `global-variable.referenceErrors.${violation.code}`,
	messageParams: { variable: violation.variable ?? '', ref: violation.ref ?? '', field: violation.field ?? '' },
	fallback: violation.message,
}));
