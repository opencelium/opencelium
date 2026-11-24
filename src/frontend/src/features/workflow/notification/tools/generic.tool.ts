import type { NotificationTool } from './notificationTool.types';

export const genericTool: NotificationTool = {
	id: 'generic',
	name: 'Generic webhook',
	nameKey: 'notification.tools.generic.name',
	abbreviation: '{ }',
	brandColor: '#56606b',
	markup: 'markdown',
	isJsonOnly: true,
	webhook: { placeholder: 'https://…', pattern: /^https?:\/\// },
	guide: { stepCount: 3, facts: ['method', 'response'], noteCount: 1 },
	response: { status: '2xx', contentType: null, sampleBody: '', params: [
		{ path: '(response).status', labelKey: 'notification.response.params.status', example: '200' },
		{ path: '(response).body', labelKey: 'notification.response.params.body', example: '…' },
	] },
	fields: [],
	createDefaults: () => ({}),
	// Never asked: a JSON-only tool's content is judged from its JSON (see hasMessageContent).
	hasContent: () => false,
	// The generic webhook has no editor, so its body only ever comes from the JSON override.
	buildBody: () => ({}),
	toPreview: (json) => ({ kind: 'raw', json: JSON.stringify(json, null, 2) }),
};
