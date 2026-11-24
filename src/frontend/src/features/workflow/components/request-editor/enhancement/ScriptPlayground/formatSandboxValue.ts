export function formatSandboxValue(value: unknown): string {
	if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
	return JSON.stringify(value, null, 2) ?? '';
}
