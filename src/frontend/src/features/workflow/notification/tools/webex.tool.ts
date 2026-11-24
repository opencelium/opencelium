import type { NotificationTool } from './notificationTool.types';
import { readString, textValue } from './toolValues';

const key = (path: string) => `notification.tools.webex.${path}`;

export const webexTool: NotificationTool = {
	id: 'webex',
	name: 'Webex',
	abbreviation: 'Wx',
	brandColor: '#0b7a75',
	markup: 'markdown',
	isJsonOnly: false,
	isPush: false,
	webhook: { placeholder: 'https://webexapis.com/v1/webhooks/incoming/…', pattern: /^https:\/\/webexapis\.com\/v1\/webhooks\/incoming\// },
	guide: { stepCount: 3, facts: ['urlFormat', 'response', 'payload'], noteCount: 1,
		docsUrl: 'https://apphub.webex.com/applications/incoming-webhooks-cisco-systems-38054-23307-75252' },
	response: { status: '204 No Content', contentType: null, sampleBody: '', params: [
		{ path: '(response).status', labelKey: 'notification.response.params.status', example: '204' },
	] },
	fields: [
		{ kind: 'select', key: 'format', labelKey: key('fields.format'), options: [
			{ value: 'markdown', labelKey: key('formats.markdown') },
			{ value: 'text', labelKey: key('formats.text') },
		] },
		{ kind: 'area', key: 'body', labelKey: key('fields.body'), helpKey: key('fields.bodyHelp') },
	],
	createDefaults: () => ({ format: 'markdown', body: '' }),
	buildBody: (values) => ({ [textValue(values, 'format') || 'markdown']: textValue(values, 'body') }),
	toPreview: (json) => ({ kind: 'chat', author: 'Incoming Webhooks', tags: [], card: null,
		lead: readString(json, 'markdown') || readString(json, 'text') }),
};
