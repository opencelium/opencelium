import type { NotificationTool } from './notificationTool.types';
import { filledFacts, readArray, readRecord, readString, textValue } from './toolValues';

const key = (path: string) => `notification.tools.google-chat.${path}`;

export const googleChatTool: NotificationTool = {
	id: 'google-chat',
	name: 'Google Chat',
	abbreviation: 'GC',
	brandColor: '#1e8e3e',
	markup: 'slack',
	isJsonOnly: false,
	isPush: false,
	webhook: { placeholder: 'https://chat.googleapis.com/v1/spaces/…/messages?key=…&token=…',
		pattern: /^https:\/\/chat\.googleapis\.com\/v1\/spaces\// },
	guide: { stepCount: 4, facts: ['urlFormat', 'response', 'availability'], noteCount: 1,
		docsUrl: 'https://developers.google.com/workspace/chat/quickstart/webhooks' },
	response: { status: '200 OK', contentType: 'application/json',
		sampleBody: JSON.stringify({ name: 'spaces/AAAA9/messages/Xy1.Xy1', thread: { name: 'spaces/AAAA9/threads/Xy1' },
			createTime: '2026-11-20T09:14:03.112Z' }, null, 2),
		params: [
			{ path: '(response).status', labelKey: 'notification.response.params.status', example: '200' },
			{ path: '(response).body.$.name', labelKey: 'notification.response.params.messageId', example: 'spaces/AAAA9/messages/Xy1.Xy1' },
			{ path: '(response).body.$.thread.name', labelKey: 'notification.response.params.threadId', example: 'spaces/AAAA9/threads/Xy1' },
			{ path: '(response).body.$.createTime', labelKey: 'notification.response.params.timestamp', example: '2026-11-20T09:14:03Z' },
		] },
	fields: [
		{ kind: 'area', key: 'text', labelKey: 'notification.fields.text', helpKey: key('fields.textHelp') },
		{ kind: 'group', id: 'card', titleKey: key('fields.cardGroup'), items: [
			{ kind: 'row', id: 'title', fields: [
				{ kind: 'line', key: 'title', labelKey: key('fields.cardTitle') },
				{ kind: 'line', key: 'subtitle', labelKey: key('fields.subtitle') },
			] },
			{ kind: 'facts', key: 'facts', labelKey: key('fields.facts') },
			{ kind: 'row', id: 'button', fields: [
				{ kind: 'text', key: 'buttonText', labelKey: 'notification.fields.buttonText' },
				{ kind: 'line', key: 'buttonUrl', labelKey: 'notification.fields.buttonUrl' },
			] },
		] },
		{ kind: 'line', key: 'threadKey', labelKey: key('fields.threadKey'), helpKey: key('fields.threadKeyHelp') },
	],
	createDefaults: () => ({ text: '', title: '', subtitle: '', facts: [], buttonText: '', buttonUrl: '', threadKey: '' }),
	buildBody: (values) => {
		const text = textValue(values, 'text');
		const title = textValue(values, 'title');
		const facts = filledFacts(values);
		const buttonText = textValue(values, 'buttonText');
		const buttonUrl = textValue(values, 'buttonUrl');
		const threadKey = textValue(values, 'threadKey');
		const widgets: unknown[] = facts.map((fact) => ({ decoratedText: { topLabel: fact.label, text: fact.value } }));
		if (buttonText && buttonUrl) widgets.push({ buttonList: { buttons: [{ text: buttonText, onClick: { openLink: { url: buttonUrl } } }] } });
		return {
			...(text ? { text } : {}),
			...(title || facts.length ? { cardsV2: [{ cardId: 'oc-notification', card: {
				header: { title, subtitle: textValue(values, 'subtitle') }, sections: [{ widgets }],
			} }] } : {}),
			...(threadKey ? { thread: { threadKey } } : {}),
		};
	},
	toPreview: (json) => {
		const card = readRecord(readArray(json, 'cardsV2')[0], 'card');
		const lead = readString(json, 'text');
		if (!Object.keys(card).length) return { kind: 'chat', lead, tags: [], card: null };
		const header = readRecord(card, 'header');
		const facts: [string, string][] = [];
		let button: string | undefined;
		readArray(readArray(card, 'sections')[0], 'widgets').forEach((widget) => {
			const decorated = readRecord(widget, 'decoratedText');
			if (Object.keys(decorated).length) facts.push([readString(decorated, 'topLabel'), readString(decorated, 'text')]);
			const buttons = readArray(readRecord(widget, 'buttonList'), 'buttons');
			if (buttons.length) button = readString(buttons[0], 'text');
		});
		return { kind: 'chat', lead, tags: [], card: { title: readString(header, 'title'), subtitle: readString(header, 'subtitle'),
			facts, factsLayout: 'list', button, accent: googleChatTool.brandColor } };
	},
};
