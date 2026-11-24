import type { NotificationTool } from './notificationTool.types';
import { filledFacts, hexToInt, intToHex, isRecord, readArray, readString, textValue } from './toolValues';

const key = (path: string) => `notification.tools.discord.${path}`;

export const discordTool: NotificationTool = {
	id: 'discord',
	name: 'Discord',
	abbreviation: 'Dc',
	brandColor: '#5865f2',
	markup: 'markdown',
	isJsonOnly: false,
	isPush: false,
	webhook: { placeholder: 'https://discord.com/api/webhooks/{id}/{token}', pattern: /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\// },
	guide: { stepCount: 3, facts: ['urlFormat', 'response', 'limits'], noteCount: 1,
		docsUrl: 'https://support.discord.com/hc/articles/228383668' },
	response: { status: '204 No Content / 200 OK (?wait=true)', contentType: 'application/json',
		sampleBody: JSON.stringify({ id: '1309812345678901234', channel_id: '1187000000000000000',
			timestamp: '2026-11-20T09:14:03.112000+00:00' }, null, 2),
		params: [
			{ path: '(response).status', labelKey: 'notification.response.params.status', example: '200 / 204' },
			{ path: '(response).body.$.id', labelKey: 'notification.response.params.messageId', example: '1309812345678901234' },
			{ path: '(response).body.$.channel_id', labelKey: 'notification.response.params.channelId', example: '1187000000000000000' },
		] },
	fields: [
		{ kind: 'area', key: 'content', labelKey: key('fields.content'), helpKey: key('fields.contentHelp') },
		{ kind: 'row', id: 'author', fields: [
			{ kind: 'line', key: 'username', labelKey: 'notification.fields.displayName' },
			{ kind: 'line', key: 'avatarUrl', labelKey: 'notification.fields.avatarUrl' },
		] },
		{ kind: 'group', id: 'embed', titleKey: key('fields.embedGroup'), items: [
			{ kind: 'row', id: 'title', fields: [
				{ kind: 'line', key: 'title', labelKey: 'notification.fields.title' },
				{ kind: 'color', key: 'color', labelKey: 'notification.fields.color' },
			] },
			{ kind: 'area', key: 'description', labelKey: key('fields.description') },
			{ kind: 'facts', key: 'facts', labelKey: key('fields.facts') },
			{ kind: 'line', key: 'url', labelKey: key('fields.titleUrl') },
		] },
	],
	createDefaults: () => ({ content: '', username: 'OpenCelium', avatarUrl: '', title: '', color: '#5865f2', description: '', facts: [], url: '' }),
	buildBody: (values) => {
		const facts = filledFacts(values);
		const title = textValue(values, 'title');
		const url = textValue(values, 'url');
		const description = textValue(values, 'description');
		const color = hexToInt(textValue(values, 'color'));
		const embed = {
			...(title ? { title } : {}), ...(url ? { url } : {}), ...(description ? { description } : {}),
			...(color !== undefined ? { color } : {}),
			...(facts.length ? { fields: facts.map((fact) => ({ name: fact.label, value: fact.value, inline: true })) } : {}),
		};
		const hasEmbed = Object.keys(embed).some((name) => name !== 'color');
		const content = textValue(values, 'content');
		const username = textValue(values, 'username');
		const avatarUrl = textValue(values, 'avatarUrl');
		return {
			...(content ? { content } : {}), ...(username ? { username } : {}), ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
			...(hasEmbed ? { embeds: [embed] } : {}),
		};
	},
	toPreview: (json) => {
		const embed = readArray(json, 'embeds')[0];
		return { kind: 'chat', author: readString(json, 'username') || undefined, lead: readString(json, 'content'), tags: [],
			card: isRecord(embed) ? {
				title: readString(embed, 'title'), text: readString(embed, 'description'), accent: intToHex(embed.color),
				facts: readArray(embed, 'fields').map((field) => [readString(field, 'name'), readString(field, 'value')]),
				factsLayout: 'grid',
			} : null };
	},
};
