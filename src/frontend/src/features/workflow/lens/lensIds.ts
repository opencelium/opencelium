export const LENS_ELEMENT_PREFIX = 'lens:';

export const isLensElementId = (id: string | undefined) =>
	!!id && id.startsWith(LENS_ELEMENT_PREFIX);

export const lensCardId = (nodeId: string) => `${LENS_ELEMENT_PREFIX}card:${nodeId}`;

export const lensPairEdgeId = (sourceNodeId: string, targetNodeId: string) =>
	`${LENS_ELEMENT_PREFIX}pair:${sourceNodeId}:${targetNodeId}`;

export const lensReferenceEdgeId = (bindingKey: string) =>
	`${LENS_ELEMENT_PREFIX}ref:${bindingKey}`;

// A field can be both a request target and a response source under the same
// path, so the row's role is part of its handle identity.
export const lensRowHandleId = (role: 'source' | 'target', path: string) => `${role}:${path}`;
