import type { MultiValueHeaders } from '../../model/playground.types';

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

const TEXT_CONTENT_TYPE_RE = /json|xml|text\/|html|javascript|x-www-form-urlencoded|yaml|csv/i;

const readHeader = (headers: MultiValueHeaders | null | undefined, name: string) =>
	Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name)?.[1]?.[0] ?? null;

// The backend sends binary content (files, images, PDFs) as a Base64 string.
export function readBinaryBody(body: unknown, headers: MultiValueHeaders | null | undefined) {
	const contentType = readHeader(headers, 'content-type');
	if (typeof body !== 'string' || !contentType || TEXT_CONTENT_TYPE_RE.test(contentType)) return null;
	const fileName = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(readHeader(headers, 'content-disposition') ?? '')?.[1];
	return { base64: body, contentType, fileName: fileName ? decodeURIComponent(fileName) : 'response' };
}

export function downloadBase64({ base64, contentType, fileName }: NonNullable<ReturnType<typeof readBinaryBody>>) {
	const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
	const url = URL.createObjectURL(new Blob([bytes], { type: contentType }));
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
