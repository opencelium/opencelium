import type { MainResponse } from '../../types/connection';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import { getNotificationTool } from '../tools/notificationTools';
import type { NotificationResponseSpec } from '../tools/notificationTool.types';
import { getActiveDraft } from './notificationConfig';
import { getBodyText, parseBody } from './notificationBody';
import type { NotificationConfig } from './notification.types';

export const NOTIFICATION_CONTENT_TYPE = 'application/json; charset=utf-8';

const toPayload = (fields: unknown) => ({
	type: Array.isArray(fields) ? 'array' as const : 'object' as const,
	format: 'json' as const, data: 'raw' as const, fields: fields ?? {},
});

const buildResponse = (nodeId: string, spec: NotificationResponseSpec): MainResponse => {
	const sample = spec.contentType === 'application/json' ? parseBody(spec.sampleBody) : null;
	return {
		responseId: `response-${nodeId}`,
		success: { status: spec.status.slice(0, 3), header: {}, body: toPayload(sample?.ok ? sample.value : {}) },
		fail: { status: '500', header: {}, body: toPayload({}) },
	};
};

/**
 * The HTTP request the step sends, derived from the notification config so that saving,
 * test runs and the reference pickers treat the step like any other HTTP method.
 */
export const buildNotificationMethodConfig = (
	nodeId: string,
	config: NotificationConfig,
	previous?: WorkflowMethodConfig,
): WorkflowMethodConfig => {
	const draft = getActiveDraft(config);
	const parsed = parseBody(getBodyText(config));
	const headers = Object.fromEntries([
		['Content-Type', NOTIFICATION_CONTENT_TYPE],
		...config.extraHeaders.filter((header) => header.name.trim()).map((header) => [header.name.trim(), header.value]),
	]);
	return {
		name: previous?.name ?? 'POST',
		url: draft?.webhookUrl ?? '',
		method: 'POST',
		headers,
		queryParams: [],
		endpointArgs: {},
		bodyFormat: 'json',
		bodyData: 'raw',
		body: parsed.ok ? parsed.value : {},
		...(config.tool ? { response: buildResponse(nodeId, getNotificationTool(config.tool).response) } : {}),
	};
};
