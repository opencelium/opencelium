import { getNotificationTool } from '../tools/notificationTools';
import { getActiveDraft } from './notificationConfig';
import type { NotificationConfig } from './notification.types';

/** `{%#a1b2c3.(response).body.$.x%}` — the standard reference token, captured without its braces. */
export const REFERENCE_TOKEN_RE = /\{%\s*(#[0-9a-fA-F]{6}\.\((?:request|response)\)[^%]*?)\s*%\}/g;

export const wrapReference = (reference: string) => `{%${reference}%}`;

/** Every token a notification field may hold: a step reference, a webhook parameter or a global variable. */
export const ANY_REFERENCE_TOKEN_RE = new RegExp(
	[REFERENCE_TOKEN_RE.source, String.raw`\$\{[^}\s]+\}`, String.raw`\{\{\s*global\.[^}]+\}\}`].join('|'), 'g');

/** The picker hands back a bare step reference (`#a1b2c3.(response)…`); the other kinds are complete tokens already. */
export const toReferenceToken = (picked: string) => picked.startsWith('#') ? wrapReference(picked) : picked;

export const hasReference = (value: string) => new RegExp(ANY_REFERENCE_TOKEN_RE.source).test(value);

export const countReferences = (value: string) => value.match(new RegExp(ANY_REFERENCE_TOKEN_RE.source, 'g'))?.length ?? 0;

export type ParsedBody = { ok: true; value: unknown } | { ok: false; error: string };

export const parseBody = (text: string): ParsedBody => {
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : String(error) };
	}
};

export const buildEditorBodyText = (config: NotificationConfig): string => {
	const draft = getActiveDraft(config);
	if (!config.tool || !draft) return '{}';
	return JSON.stringify(getNotificationTool(config.tool).buildBody(draft.message), null, 2);
};

/** The exact body that is sent: the hand-edited JSON when there is one, otherwise the editor's output. */
export const getBodyText = (config: NotificationConfig): string =>
	getActiveDraft(config)?.jsonOverride ?? buildEditorBodyText(config);

export const isBodyOverridden = (config: NotificationConfig) =>
	!!config.tool && !getNotificationTool(config.tool).isJsonOnly && getActiveDraft(config)?.jsonOverride !== undefined;

const hasFilledValue = (value: unknown): boolean => {
	if (typeof value === 'string') return value.trim().length > 0;
	if (typeof value === 'number' || typeof value === 'boolean') return false;
	if (Array.isArray(value)) return value.some(hasFilledValue);
	if (value && typeof value === 'object') return Object.values(value).some(hasFilledValue);
	return false;
};

/**
 * Whether the message says anything. The editor asks the tool which fields matter; hand-edited
 * JSON (and the JSON-only generic webhook) counts as content once any string in it is filled —
 * flags and numbers alone, like `unfurl_links: false`, do not.
 */
export const hasMessageContent = (config: NotificationConfig): boolean => {
	const draft = getActiveDraft(config);
	if (!config.tool || !draft) return false;
	if (draft.jsonOverride !== undefined) {
		const parsed = parseBody(draft.jsonOverride);
		return parsed.ok && hasFilledValue(parsed.value);
	}
	return getNotificationTool(config.tool).hasContent(draft.message);
};
