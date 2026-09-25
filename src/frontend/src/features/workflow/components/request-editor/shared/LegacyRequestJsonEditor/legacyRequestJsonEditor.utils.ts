import { extractWebhookValue, webhookSnippet } from '../../body-editor/bodyWebhook';
import { setBodySelectionValue } from '../../body-editor/bodyValue';

export const isString = (value: unknown): value is string => typeof value === 'string';

export const removeWebhookSnippet = (value: string, webhook: string) => {
	const snippet = webhookSnippet(webhook);
	const current = String(value || '');
	const parts = current.split(';').map((item) => item.trim()).filter(Boolean);
	const nextParts = parts.filter((item) => item !== snippet);
	if (nextParts.length !== parts.length) return nextParts.join(';');
	if (current.includes(snippet)) return current.replace(snippet, '')
		.replace(/\s*;\s*;\s*/g, '; ').replace(/^\s*;\s*|\s*;\s*$/g, '').trim();
	return extractWebhookValue(current) === webhook ? '' : null;
};

export const findReferencedField = (source: Record<string, unknown>,
	matcher: (value: string) => string | null) => {
	const visit = (value: unknown, namespace: string[] = [], name?: string): any => {
		if (typeof value === 'string' && name) {
			const nextValue = matcher(value);
			if (nextValue !== null) return { namespace, name, existingValue: value, newValue: nextValue,
				updatedSource: setBodySelectionValue(source,
					{ namespace, name, value, pathLabel: [...namespace, name].join('.') }, nextValue) };
		}
		if (Array.isArray(value)) {
			for (let index = 0; index < value.length; index += 1) {
				const found = visit(value[index], [...namespace, name].filter(isString), String(index));
				if (found) return found;
			}
		} else if (value && typeof value === 'object') {
			for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
				const found = visit(nested, [...namespace, name].filter(isString), key);
				if (found) return found;
			}
		}
		return null;
	};
	return visit(source);
};
