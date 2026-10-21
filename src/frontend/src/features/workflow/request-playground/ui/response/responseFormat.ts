export const toBodyText = (body: unknown, isPretty: boolean) => {
	if (body === undefined || body === null) return '';
	return typeof body === 'string' ? body : JSON.stringify(body, null, isPretty ? 2 : undefined);
};

export function formatSize(body: unknown): string {
	const bytes = new TextEncoder().encode(toBodyText(body, false)).length;
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// A JSON-RPC API (i-doit and the like) answers 200 OK and reports its failure in the body.
export function readJsonRpcErrorCode(body: unknown): number | string | null {
	if (!body || typeof body !== 'object' || !('error' in body)) return null;
	const error = (body as { error?: unknown }).error;
	if (!error || typeof error !== 'object' || !('code' in error)) return null;
	const code = (error as { code?: unknown }).code;
	return typeof code === 'number' || typeof code === 'string' ? code : null;
}
