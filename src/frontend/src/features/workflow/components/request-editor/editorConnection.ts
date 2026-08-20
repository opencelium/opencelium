import { buildFromConnectorPayload } from '../../api/connectionPayload';
import type { Connection, FieldBinding, OperatorWithId } from '../../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { buildLegacyConnection } from './legacyAdapter';

/**
 * The connection shape the per-modal legacy store is seeded with: the editors'
 * own `buildLegacyConnection` shape, but with the *tree-path* method indices and
 * the operator list from the save payload — see the two-connection-shapes note
 * in CLAUDE.md. Reference scope (which method can read which) is decided from
 * those indices, so an editor seeded without them silently offers the wrong
 * references.
 */
export const buildEditorConnection = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[] = [],
	fieldBindings?: readonly unknown[],
): Connection => {
	const legacyConnection = buildLegacyConnection(nodes);
	const payload = buildFromConnectorPayload(nodes, edges);
	const indexById = new Map(payload.methods.map((method) => [method.id, method.index]));

	return {
		...legacyConnection,
		...(Array.isArray(fieldBindings) ? { fieldBindings: fieldBindings as FieldBinding[] } : {}),
		fromConnector: {
			...legacyConnection.fromConnector,
			method: legacyConnection.fromConnector.method.map((method) => ({
				...method,
				index: indexById.get(method.id) ?? method.index,
			})),
			// The payload's operators carry index/type/iterator but no node id; the
			// consumers of this shape (condition dialog, reference scope) read only
			// the former.
			operator: payload.operators as unknown as OperatorWithId[],
		},
		ui: { ...legacyConnection.ui, workflowEdges: edges } as Connection['ui'],
	};
};
