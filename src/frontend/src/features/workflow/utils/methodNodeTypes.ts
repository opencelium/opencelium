export const METHOD_NODE_TYPES = ['connector', 'system', 'trigger-connection', 'notification'] as const;

export type MethodNodeType = (typeof METHOD_NODE_TYPES)[number];

export const isMethodNodeType = (type: string | undefined): type is MethodNodeType =>
	(METHOD_NODE_TYPES as readonly string[]).includes(type ?? '');

/** Method steps whose request is a plain HTTP call rather than a connector operation. */
export const isHttpRequestNodeType = (type: string | undefined): type is Exclude<MethodNodeType, 'connector'> =>
	type === 'system' || type === 'trigger-connection' || type === 'notification';
