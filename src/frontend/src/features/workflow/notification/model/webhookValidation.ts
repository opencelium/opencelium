import type { NotificationTool } from '../tools/notificationTool.types';
import { hasReference } from './notificationBody';

/** A mismatch is advice only — some tools allow custom hosts — so it never blocks saving. */
export type WebhookValidation = 'empty' | 'reference' | 'match' | 'mismatch';

export const validateWebhookUrl = (tool: NotificationTool, url: string): WebhookValidation => {
	const value = url.trim();
	if (!value) return 'empty';
	if (hasReference(value)) return 'reference';
	return tool.webhook.pattern.test(value) ? 'match' : 'mismatch';
};
