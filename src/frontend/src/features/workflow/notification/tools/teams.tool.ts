import teamsLogo from '@assets/images/notification/teams.png';
import type { NotificationPreviewCard, NotificationPreviewTone, NotificationTool } from './notificationTool.types';
import { filledFacts, flagValue, readArray, readRecord, readString, textValue } from './toolValues';

const key = (path: string) => `notification.tools.teams.${path}`;
const TONES: NotificationPreviewTone[] = ['good', 'warning', 'attention', 'accent'];
const isTone = (value: string): value is NotificationPreviewTone => (TONES as string[]).includes(value);

export const teamsTool: NotificationTool = {
	id: 'teams',
	name: 'Microsoft Teams',
	abbreviation: 'Te',
	logo: teamsLogo,
	brandColor: '#4b53bc',
	markup: 'markdown',
	isJsonOnly: false,
	webhook: { placeholder: 'https://….logic.azure.com/workflows/…',
		pattern: /^https:\/\/[^/]+\.(logic\.azure\.com|powerplatform\.com|api\.powerplatform\.com)/ },
	guide: { stepCount: 4, facts: ['urlFormat', 'response', 'payload'], noteCount: 2,
		docsUrl: 'https://support.microsoft.com/office/8ae491c7-0394-4861-ba59-055e33f75498' },
	response: { status: '202 Accepted', contentType: null, sampleBody: '', params: [
		{ path: '(response).status', labelKey: 'notification.response.params.status', example: '202' },
	] },
	fields: [
		{ kind: 'row', id: 'title', fields: [
			{ kind: 'line', key: 'title', labelKey: 'notification.fields.title' },
			{ kind: 'select', key: 'style', labelKey: key('fields.style'), options: [
				{ value: 'default', labelKey: key('styles.default') },
				{ value: 'accent', labelKey: key('styles.accent') },
				{ value: 'good', labelKey: key('styles.good') },
				{ value: 'warning', labelKey: key('styles.warning') },
				{ value: 'attention', labelKey: key('styles.attention') },
			] },
		] },
		{ kind: 'area', key: 'text', labelKey: key('fields.text'), helpKey: key('fields.textHelp') },
		{ kind: 'facts', key: 'facts', labelKey: key('fields.facts') },
		{ kind: 'row', id: 'button', fields: [
			{ kind: 'text', key: 'buttonText', labelKey: key('fields.buttonText') },
			{ kind: 'line', key: 'buttonUrl', labelKey: 'notification.fields.buttonUrl' },
		] },
		{ kind: 'line', key: 'mention', labelKey: key('fields.mention'), placeholderKey: key('fields.mentionPlaceholder') },
		{ kind: 'toggle', key: 'fullWidth', labelKey: key('fields.fullWidth') },
	],
	createDefaults: () => ({ title: '', style: 'default', text: '', facts: [], buttonText: '', buttonUrl: '', mention: '', fullWidth: true }),
	buildBody: (values) => {
		const title = textValue(values, 'title');
		const text = textValue(values, 'text');
		const mention = textValue(values, 'mention');
		const facts = filledFacts(values);
		const body: unknown[] = [];
		if (title) body.push({ type: 'TextBlock', size: 'Large', weight: 'Bolder', text: title, color: textValue(values, 'style') || 'default', wrap: true });
		if (text) body.push({ type: 'TextBlock', text, wrap: true });
		if (facts.length) body.push({ type: 'FactSet', facts: facts.map((fact) => ({ title: fact.label, value: fact.value })) });
		if (mention) body.push({ type: 'TextBlock', text: `<at>${mention}</at>`, wrap: true });
		const msteams = {
			...(flagValue(values, 'fullWidth') ? { width: 'Full' } : {}),
			...(mention ? { entities: [{ type: 'mention', text: `<at>${mention}</at>`, mentioned: { id: mention, name: mention } }] } : {}),
		};
		const buttonText = textValue(values, 'buttonText');
		const buttonUrl = textValue(values, 'buttonUrl');
		const content = {
			$schema: 'http://adaptivecards.io/schemas/adaptive-card.json', type: 'AdaptiveCard', version: '1.4', body,
			...(buttonText && buttonUrl ? { actions: [{ type: 'Action.OpenUrl', title: buttonText, url: buttonUrl }] } : {}),
			...(Object.keys(msteams).length ? { msteams } : {}),
		};
		return { type: 'message', attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', contentUrl: null, content }] };
	},
	toPreview: (json) => {
		const content = readRecord(readArray(json, 'attachments')[0], 'content');
		const card: NotificationPreviewCard = { facts: [], factsLayout: 'list', text: '', accent: teamsTool.brandColor };
		readArray(content, 'body').forEach((block) => {
			const type = readString(block, 'type');
			if (type === 'TextBlock' && readString(block, 'weight') === 'Bolder' && !card.title) {
				card.title = readString(block, 'text');
				const color = readString(block, 'color');
				if (isTone(color)) card.titleTone = color;
			} else if (type === 'TextBlock') {
				card.text = [card.text, readString(block, 'text').replace(/<\/?at>/g, '@')].filter(Boolean).join('\n');
			}
			if (type === 'FactSet') readArray(block, 'facts').forEach((fact) =>
				card.facts.push([readString(fact, 'title'), readString(fact, 'value')]));
		});
		const action = readArray(content, 'actions')[0];
		if (action) card.button = readString(action, 'title');
		return { kind: 'chat', lead: '', card };
	},
};
