import type { WorkflowNodeModel } from '../types/workflow.types';

export const METHOD_NODE_TYPES = ['connector', 'system', 'trigger-connection', 'notification'] as const;

export type MethodNodeType = (typeof METHOD_NODE_TYPES)[number];

export const isMethodNodeType = (type: string | undefined): type is MethodNodeType =>
	(METHOD_NODE_TYPES as readonly string[]).includes(type ?? '');

/** Method steps whose request is a plain HTTP call rather than a connector operation. */
export const isHttpRequestNodeType = (type: string | undefined): type is Exclude<MethodNodeType, 'connector'> =>
	type === 'system' || type === 'trigger-connection' || type === 'notification';

/**
 * The step's own name, sent to the backend as `label`. Until renamed, a method step's subtitle is
 * its operation name, which the backend already has as `name`. A notification is the exception:
 * its name is always "POST", so without a label the logs would show that instead of the step.
 */
export const getMethodLabel = (node: WorkflowNodeModel): string | undefined =>
	node.data.labelEdited || node.type === 'notification' ? node.data.subtitle?.trim() || undefined : undefined;
