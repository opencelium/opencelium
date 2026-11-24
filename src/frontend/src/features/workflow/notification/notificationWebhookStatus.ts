import { PAYLOAD_REFERENCE_RE } from '../api/connectionPayload.references';
import { notificationTools, type NotificationTool } from '../nodes/NotificationNode/notificationTools';

export function getNotificationWebhookStatus(rawUrl: string, tool?: NotificationTool) {
	const url = rawUrl.trim();
	if (!url) return 'empty';
	if ([...url.matchAll(PAYLOAD_REFERENCE_RE)].length > 0) return 'reference';
	if (!tool || /\s/.test(url) || !notificationTools[tool].webhook.test(url)) return 'mismatch';

	try {
		const parsed = new URL(url);
		return parsed.hostname && (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? 'match' : 'mismatch';
	} catch {
		return 'mismatch';
	}
}
