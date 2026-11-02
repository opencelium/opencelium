import { resolveConnectorIcon } from '@entities/connector/model/iconUrl';
import { insertionPoint, lastMainStepId, type InsertPosition } from './insertionPoint';
import { workflowCommandBridgeStore } from './workflowCommandBridge';

export type AddMethodRequest = {
	connectorId: number;
	operationName: string;
	/** The step to add after or before; null for "the selected method, else the end of the workflow". */
	anchorNodeId: string | null;
	position: InsertPosition;
};

export type AddMethodResult =
	| { kind: 'added'; nodeId: string; method: string; connector: string }
	| { kind: 'not-editable' }
	| { kind: 'unknown-connector' }
	| { kind: 'unknown-operation' }
	| { kind: 'no-place' };

/**
 * Adds a connector method to the open workflow the way the "+" and the sidebar would,
 * and brings it into view. Used by voice and typed requests; the user undoes it like
 * any other edit.
 */
export function addMethodStep({ connectorId, operationName, anchorNodeId, position }: AddMethodRequest): AddMethodResult {
	const bridge = workflowCommandBridgeStore.getState();
	if (!bridge.isActive || !bridge.isEditable()) return { kind: 'not-editable' };
	const connector = bridge.getConnectors().find((item) => item.connectorId === connectorId);
	if (!connector) return { kind: 'unknown-connector' };
	const operation = connector.invoker?.operations?.find((item) => item.name === operationName && item.type !== 'test');
	if (!operation) return { kind: 'unknown-operation' };

	const nodes = bridge.getNodes();
	const edges = bridge.getEdges();
	const selected = nodes.find((node) => node.selected && (node.type === 'connector' || node.type === 'system'));
	const anchor = anchorNodeId ?? selected?.id ?? lastMainStepId(nodes, edges);
	// Without a named step there is nothing to be "before"; it goes after the fallback.
	const point = anchor ? insertionPoint(nodes, edges, anchor, anchorNodeId ? position : 'after') : null;
	if (!point) return { kind: 'no-place' };

	const nodeId = bridge.addStep({
		...point,
		kind: 'connector',
		methodName: operation.name,
		methodOperation: operation,
		connector: { connectorId: connector.connectorId, title: connector.title, icon: resolveConnectorIcon(connector) },
	});
	if (!nodeId) return { kind: 'no-place' };
	// A frame later: the canvas has not laid the new node out yet.
	requestAnimationFrame(() => bridge.centerOnNode(nodeId));
	return { kind: 'added', nodeId, method: operation.name, connector: connector.title };
}
