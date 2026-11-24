import type { NotificationTool } from './notificationTool.types';
import { filledFacts, isRecord, readArray, readRecord, readString, textValue } from './toolValues';

const key = (path: string) => `notification.tools.mattermost.${path}`;

export const mattermostTool: NotificationTool = {
	id: 'mattermost',
	name: 'Mattermost',
	abbreviation: 'Mm',
	brandColor: '#1e325c',
	markup: 'markdown',
	isJsonOnly: false,
	isPush: false,
	webhook: { placeholder: 'https://chat.example.com/hooks/xxxxxxxxxxxxxxxxxxxxxx', pattern: /^https?:\/\/[^/]+\/hooks\/[a-z0-9]+$/i },
	guide: { stepCount: 3, facts: ['urlFormat', 'response', 'requirement'], noteCount: 1,
		docsUrl: 'https://developers.mattermost.com/integrate/webhooks/incoming/' },
	response: { status: '200 OK', contentType: 'text/plain', sampleBody: 'ok', params: [
		{ path: '(response).status', labelKey: 'notification.response.params.status', example: '200' },
		{ path: '(response).body', labelKey: 'notification.response.params.text', example: 'ok' },
	] },
	fields: [
		{ kind: 'area', key: 'text', labelKey: 'notification.fields.textMarkdown' },
		{ kind: 'row', id: 'channel', fields: [
			{ kind: 'line', key: 'channel', labelKey: key('fields.channel'), placeholderKey: key('fields.channelPlaceholder') },
			{ kind: 'select', key: 'priority', labelKey: 'notification.fields.priority', options: [
				{ value: '', labelKey: key('priorities.standard') },
				{ value: 'important', labelKey: key('priorities.important') },
				{ value: 'urgent', labelKey: key('priorities.urgent') },
			] },
		] },
		{ kind: 'row', id: 'author', fields: [
			{ kind: 'text', key: 'username', labelKey: 'notification.fields.username' },
			{ kind: 'line', key: 'iconUrl', labelKey: 'notification.fields.iconUrl' },
		] },
		{ kind: 'group', id: 'attachment', titleKey: 'notification.fields.attachmentGroup', items: [
			{ kind: 'row', id: 'title', fields: [
				{ kind: 'line', key: 'attachmentTitle', labelKey: 'notification.fields.title' },
				{ kind: 'color', key: 'color', labelKey: 'notification.fields.color' },
			] },
			{ kind: 'facts', key: 'facts', labelKey: 'notification.fields.facts' },
		] },
	],
	createDefaults: () => ({ text: '', channel: '', priority: '', username: 'OpenCelium', iconUrl: '', attachmentTitle: '', color: '#1e325c', facts: [] }),
	buildBody: (values) => {
		const facts = filledFacts(values);
		const attachmentTitle = textValue(values, 'attachmentTitle');
		const channel = textValue(values, 'channel');
		const username = textValue(values, 'username');
		const iconUrl = textValue(values, 'iconUrl');
		const priority = textValue(values, 'priority');
		return {
			text: textValue(values, 'text'),
			...(channel ? { channel } : {}), ...(username ? { username } : {}), ...(iconUrl ? { icon_url: iconUrl } : {}),
			...(priority ? { priority: { priority } } : {}),
			...(attachmentTitle || facts.length ? { attachments: [{ color: textValue(values, 'color'), title: attachmentTitle,
				fields: facts.map((fact) => ({ short: true, title: fact.label, value: fact.value })) }] } : {}),
		};
	},
	toPreview: (json) => {
		const tags: string[] = [];
		const priority = readString(readRecord(json, 'priority'), 'priority');
		if (priority) tags.push(priority.toUpperCase());
		const channel = readString(json, 'channel');
		if (channel) tags.push(`→ ${channel}`);
		const attachment = readArray(json, 'attachments')[0];
		return { kind: 'chat', author: readString(json, 'username') || undefined, tags,
			lead: readString(json, 'text').replace(/^#+\s*/gm, ''),
			card: isRecord(attachment) ? { title: readString(attachment, 'title'), accent: readString(attachment, 'color') || undefined,
				facts: readArray(attachment, 'fields').map((field) => [readString(field, 'title'), readString(field, 'value')]),
				factsLayout: 'grid' } : null };
	},
};
