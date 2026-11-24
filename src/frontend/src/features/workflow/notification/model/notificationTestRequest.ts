import { buildMethodPayload } from '../../api/connectionPayload.methods';
import { buildWorkflowIndexes } from '../../api/connectionPayload.indexes';
import type { MethodTestRefs, PlaygroundDraft } from '../../request-playground/model/playground.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { buildNotificationMethodConfig } from './notificationMethodConfig';
import type { NotificationConfig } from './notification.types';

/** The step as it would be saved right now — from the dialog's unsaved config, not the canvas node. */
export const buildNotificationTestDraft = (
	node: WorkflowNodeModel,
	config: NotificationConfig,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): PlaygroundDraft => {
	const draftNode: WorkflowNodeModel = { ...node, data: { ...node.data, notification: config,
		methodConfig: buildNotificationMethodConfig(node.id, config, node.data.methodConfig) } };
	const index = buildWorkflowIndexes(nodes, edges).get(node.id) ?? '0';
	return buildMethodPayload(draftNode, index, 0, node.data.color);
};

const REFERENCE_PATH_RE = /\((?:response|request)\)\.(?:body\.\$\.?)?(.*?)\s*%?\}?$/;
const WEBHOOK_PARAM_RE = /^\$\{([^}:\s]+)/;

/**
 * A test has no earlier steps to read from, so every reference gets a readable placeholder
 * — `[customer.name]` — and the message still arrives with its layout intact.
 */
export const buildPlaceholderValues = (refs: MethodTestRefs): Record<string, unknown> => Object.fromEntries(
	refs.staticReferences.map(({ reference }) => {
		const path = WEBHOOK_PARAM_RE.exec(reference)?.[1] ?? (REFERENCE_PATH_RE.exec(reference)?.[1] || 'value');
		return [reference, `[${path}]`];
	}),
);
