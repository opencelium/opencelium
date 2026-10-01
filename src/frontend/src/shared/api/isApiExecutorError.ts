const FETCH_ERROR_STATUSES: ReadonlySet<unknown> = new Set(['FETCH_ERROR', 'PARSING_ERROR',
	'TIMEOUT_ERROR', 'CUSTOM_ERROR']);

// Matches RTK Query's FetchBaseQueryError only — a bare `'status' in response` check would also
// match successful payloads that carry their own `status` field (Connector has status: 'UP' | ...).
export const isApiExecutorError = (response: unknown): boolean => {
	if (!response || typeof response !== 'object' || !('status' in response)) return false;
	const { status } = response;
	return typeof status === 'number' || FETCH_ERROR_STATUSES.has(status);
};
