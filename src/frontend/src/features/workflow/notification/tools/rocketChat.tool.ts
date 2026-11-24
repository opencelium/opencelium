import type { NotificationTool } from './notificationTool.types';
import { filledFacts, isRecord, readArray, readString, textValue } from './toolValues';

const key = (path: string) => `notification.tools.rocket-chat.${path}`;

export const rocketChatTool: NotificationTool = {
	id: 'rocket-chat',
	name: 'Rocket.Chat',
	abbreviation: 'RC',
	brandColor: '#c8102e',
	markup: 'markdown',
	isJsonOnly: false,
	isPush: false,
	webhook: { placeholder: 'https://chat.example.com/hooks/{id}/{token}', pattern: /^https?:\/\/[^/]+\/hooks\/[^/]+\/[^/]+/ },
	guide: { stepCount: 3, facts: ['urlFormat', 'response'], noteCount: 1, docsUrl: 'https://docs.rocket.chat/docs/integrations' },
	response: { status: '200 OK', contentType: 'application/json', sampleBody: JSON.stringify({ success: true }, null, 2), params: [
		{ path: '(response).status', labelKey: 'notification.response.params.status', example: '200' },
		{ path: '(response).body.$.success', labelKey: 'notification.response.params.success', example: 'true' },
	] },
	fields: [
		{ kind: 'area', key: 'text', labelKey: 'notification.fields.text' },
		{ kind: 'row', id: 'author', fields: [
			{ kind: 'line', key: 'alias', labelKey: key('fields.alias') },
			{ kind: 'text', key: 'emoji', labelKey: key('fields.emoji'), placeholderKey: key('fields.emojiPlaceholder') },
		] },
		{ kind: 'group', id: 'attachment', titleKey: 'notification.fields.attachmentGroup', items: [
			{ kind: 'row', id: 'title', fields: [
				{ kind: 'line', key: 'attachmentTitle', labelKey: 'notification.fields.title' },
				{ kind: 'color', key: 'color', labelKey: 'notification.fields.color' },
			] },
			{ kind: 'area', key: 'attachmentText', labelKey: 'notification.fields.text' },
			{ kind: 'facts', key: 'facts', labelKey: 'notification.fields.facts' },
		] },
	],
	createDefaults: () => ({ text: '', alias: 'OpenCelium', emoji: '', attachmentTitle: '', color: '#c8102e', attachmentText: '', facts: [] }),
	buildBody: (values) => {
		const facts = filledFacts(values);
		const attachmentTitle = textValue(values, 'attachmentTitle');
		const attachmentText = textValue(values, 'attachmentText');
		const alias = textValue(values, 'alias');
		const emoji = textValue(values, 'emoji');
		return {
			text: textValue(values, 'text'), ...(alias ? { alias } : {}), ...(emoji ? { emoji } : {}),
			...(attachmentTitle || attachmentText || facts.length ? { attachments: [{
				title: attachmentTitle, text: attachmentText, color: textValue(values, 'color'),
				fields: facts.map((fact) => ({ short: true, title: fact.label, value: fact.value })),
			}] } : {}),
		};
	},
	toPreview: (json) => {
		const attachment = readArray(json, 'attachments')[0];
		return { kind: 'chat', author: readString(json, 'alias') || undefined, lead: readString(json, 'text'), tags: [],
			card: isRecord(attachment) ? { title: readString(attachment, 'title'), text: readString(attachment, 'text'),
				accent: readString(attachment, 'color') || undefined, factsLayout: 'grid',
				facts: readArray(attachment, 'fields').map((field) => [readString(field, 'title'), readString(field, 'value')]) } : null };
	},
};
