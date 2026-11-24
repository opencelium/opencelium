import { getNotificationTool } from '../tools/notificationTools';
import { getActiveDraft } from './notificationConfig';
import type { NotificationConfig } from './notification.types';

/** `{%#a1b2c3.(response).body.$.x%}` — the standard reference token, captured without its braces. */
export const REFERENCE_TOKEN_RE = /\{%\s*(#[0-9a-fA-F]{6}\.\((?:request|response)\)[^%]*?)\s*%\}/g;

export const wrapReference = (reference: string) => `{%${reference}%}`;

export const hasReference = (value: string) => new RegExp(REFERENCE_TOKEN_RE.source).test(value);

export const countReferences = (value: string) => value.match(new RegExp(REFERENCE_TOKEN_RE.source, 'g'))?.length ?? 0;

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
