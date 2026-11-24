import type { NotificationPreviewCard, NotificationTool } from './notificationTool.types';
import { filledFacts, flagValue, readArray, readRecord, readString, textValue } from './toolValues';

const key = (path: string) => `notification.tools.slack.${path}`;

export const slackTool: NotificationTool = {
	id: 'slack',
	name: 'Slack',
	abbreviation: 'Sl',
	brandColor: '#5b2a64',
	markup: 'slack',
	isJsonOnly: false,
	isPush: false,
	webhook: { placeholder: 'https://hooks.slack.com/services/T…/B…/…', pattern: /^https:\/\/hooks\.slack\.com\/services\// },
	guide: { stepCount: 4, facts: ['urlFormat', 'response', 'errors', 'limit'], noteCount: 1,
		docsUrl: 'https://api.slack.com/messaging/webhooks' },
	response: { status: '200 OK', contentType: 'text/plain', sampleBody: 'ok', params: [
		{ path: '(response).status', labelKey: 'notification.response.params.status', example: '200' },
		{ path: '(response).body', labelKey: 'notification.response.params.text', example: 'ok' },
	] },
	fields: [
		{ kind: 'area', key: 'text', labelKey: key('fields.text'), helpKey: key('fields.textHelp') },
		{ kind: 'line', key: 'header', labelKey: key('fields.header') },
		{ kind: 'area', key: 'body', labelKey: key('fields.body'), helpKey: key('fields.bodyHelp') },
		{ kind: 'facts', key: 'facts', labelKey: key('fields.facts') },
		{ kind: 'row', id: 'button', fields: [
			{ kind: 'text', key: 'buttonText', labelKey: 'notification.fields.buttonText' },
			{ kind: 'line', key: 'buttonUrl', labelKey: 'notification.fields.buttonUrl' },
		] },
		{ kind: 'toggle', key: 'unfurl', labelKey: key('fields.unfurl') },
	],
	createDefaults: () => ({ text: '', header: '', body: '', facts: [], buttonText: '', buttonUrl: '', unfurl: false }),
	buildBody: (values) => {
		const blocks: unknown[] = [];
		const header = textValue(values, 'header');
		const body = textValue(values, 'body');
		const facts = filledFacts(values);
		if (header) blocks.push({ type: 'header', text: { type: 'plain_text', text: header } });
		if (body || facts.length) blocks.push({
			type: 'section', text: { type: 'mrkdwn', text: body || ' ' },
			...(facts.length ? { fields: facts.map((fact) => ({ type: 'mrkdwn', text: `*${fact.label}*\n${fact.value}` })) } : {}),
		});
		const buttonText = textValue(values, 'buttonText');
		const buttonUrl = textValue(values, 'buttonUrl');
		if (buttonText && buttonUrl) blocks.push({ type: 'actions', elements: [
			{ type: 'button', text: { type: 'plain_text', text: buttonText }, url: buttonUrl },
		] });
		return { text: textValue(values, 'text'), ...(blocks.length ? { blocks } : {}), unfurl_links: flagValue(values, 'unfurl') };
	},
	toPreview: (body) => {
		const blocks = readArray(body, 'blocks');
		if (!blocks.length) return { kind: 'chat', lead: readString(body, 'text'), tags: [], card: null };
		const card: NotificationPreviewCard = { facts: [], factsLayout: 'grid', isPlain: true };
		blocks.forEach((block) => {
			const type = readString(block, 'type');
			if (type === 'header') card.title = readString(readRecord(block, 'text'), 'text');
			if (type === 'section') {
				card.text = readString(readRecord(block, 'text'), 'text');
				readArray(block, 'fields').forEach((field) => {
					const [label = '', ...rest] = readString(field, 'text').split('\n');
					card.facts.push([label.replace(/^\*|\*$/g, ''), rest.join('\n')]);
				});
			}
			if (type === 'actions') card.button = readString(readRecord(readArray(block, 'elements')[0], 'text'), 'text');
		});
		return { kind: 'chat', lead: '', tags: [], card };
	},
};
