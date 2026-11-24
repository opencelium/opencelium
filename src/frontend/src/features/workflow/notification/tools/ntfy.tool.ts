import type { NotificationTool } from './notificationTool.types';
import { flagValue, readArray, readString, textValue } from './toolValues';

const key = (path: string) => `notification.tools.ntfy.${path}`;

export const ntfyTool: NotificationTool = {
	id: 'ntfy',
	name: 'ntfy',
	abbreviation: 'nt',
	brandColor: '#317f6f',
	markup: 'markdown',
	isJsonOnly: false,
	isPush: true,
	webhook: { placeholder: 'https://ntfy.sh', pattern: /^https?:\/\/[^/]+\/?$/ },
	guide: { stepCount: 3, facts: ['urlFormat', 'response', 'auth'], noteCount: 1, docsUrl: 'https://docs.ntfy.sh/publish/#publish-as-json' },
	response: { status: '200 OK', contentType: 'application/json',
		sampleBody: JSON.stringify({ id: 'hwQ2YpKdmg', time: 1795166043, event: 'message', topic: 'oc-alerts-7f3a' }, null, 2),
		params: [
			{ path: '(response).status', labelKey: 'notification.response.params.status', example: '200' },
			{ path: '(response).body.$.id', labelKey: 'notification.response.params.messageId', example: 'hwQ2YpKdmg' },
			{ path: '(response).body.$.time', labelKey: 'notification.response.params.unixTime', example: '1795166043' },
		] },
	fields: [
		{ kind: 'row', id: 'topic', fields: [
			{ kind: 'line', key: 'topic', labelKey: key('fields.topic') },
			{ kind: 'select', key: 'priority', labelKey: 'notification.fields.priority', options: ['1', '2', '3', '4', '5']
				.map((value) => ({ value, labelKey: key(`priorities.${value}`) })) },
		] },
		{ kind: 'line', key: 'title', labelKey: 'notification.fields.title' },
		{ kind: 'area', key: 'message', labelKey: key('fields.message') },
		{ kind: 'row', id: 'extras', fields: [
			{ kind: 'text', key: 'tags', labelKey: key('fields.tags'), placeholderKey: key('fields.tagsPlaceholder') },
			{ kind: 'line', key: 'click', labelKey: key('fields.click') },
		] },
		{ kind: 'toggle', key: 'markdown', labelKey: key('fields.markdown') },
	],
	createDefaults: () => ({ topic: '', priority: '3', title: '', message: '', tags: '', click: '', markdown: false }),
	buildBody: (values) => {
		const tags = textValue(values, 'tags').split(',').map((tag) => tag.trim()).filter(Boolean);
		const click = textValue(values, 'click');
		return {
			topic: textValue(values, 'topic'), title: textValue(values, 'title'), message: textValue(values, 'message'),
			priority: Number(textValue(values, 'priority') || 3),
			...(tags.length ? { tags } : {}), ...(click ? { click } : {}), ...(flagValue(values, 'markdown') ? { markdown: true } : {}),
		};
	},
	toPreview: (json) => ({ kind: 'push', topic: readString(json, 'topic'), title: readString(json, 'title'),
		message: readString(json, 'message'), priority: Number(readString(json, 'priority') || 3),
		tags: readArray(json, 'tags').map(String) }),
};
