import type { NotificationTool } from '../nodes/NotificationNode/notificationTools';

type Fact = { label: string; value: string };
type Card = { title?: string; subtitle?: string; text?: string; button?: string; facts?: Fact[]; color?: string };
export type NotificationPreviewModel = {
	text?: string;
	author?: string;
	card?: Card;
	push?: { topic: string; priority: string; tags: string[] };
};

const record = (value: unknown): Record<string, unknown> =>
	value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string => typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
const item = (value: unknown) => record(list(value)[0]);
const facts = (value: unknown, label: string) =>
	list(value).map(record).map((field) => ({ label: text(field[label]), value: text(field.value) }));
const hex = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffff
	? '#' + value.toString(16).padStart(6, '0')
	: typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;

const attachment = (payload: Record<string, unknown>, author: string): NotificationPreviewModel => {
	const card = item(payload.attachments);
	return { text: text(payload.text), author: text(payload[author]), card: Object.keys(card).length ? {
		title: text(card.title), text: text(card.text), facts: facts(card.fields, 'title'), color: hex(card.color),
	} : undefined };
};

export const notificationPreviewStrategies: Record<NotificationTool, (payload: unknown) => NotificationPreviewModel> = {
	slack: (payload) => {
		const value = record(payload);
		const blocks = list(value.blocks).map(record);
		const section = blocks.find((block) => block.type === 'section');
		const heading = blocks.find((block) => block.type === 'header');
		const action = item(blocks.find((block) => block.type === 'actions')?.elements);
		return blocks.length ? { card: {
			title: text(record(heading?.text).text),
			text: text(record(section?.text).text),
			facts: list(section?.fields).map(record).map((field) => {
				const [label, ...lines] = text(field.text).split('\n');
				return { label: label.replace(/^\*|\*$/g, ''), value: lines.join('\n') };
			}),
			button: text(record(action.text).text),
		} } : { text: text(value.text) };
	},
	teams: (payload) => {
		const card = record(item(record(payload).attachments).content);
		const elements = list(card.body).map(record);
		const heading = elements.find((element) => element.type === 'TextBlock' && element.weight === 'Bolder');
		return { card: {
			title: text(heading?.text),
			text: elements.filter((element) => element.type === 'TextBlock' && element !== heading)
				.map((element) => text(element.text).replace(/<at>(.*?)<\/at>/g, '@$1')).join('\n'),
			facts: facts(elements.find((element) => element.type === 'FactSet')?.facts, 'title'),
			button: text(item(card.actions).title),
		} };
	},
	gchat: (payload) => {
		const value = record(payload);
		const card = record(item(value.cardsV2).card);
		const header = record(card.header);
		const widgets = list(card.sections).map(record).flatMap((section) => list(section.widgets).map(record));
		return { text: text(value.text), card: Object.keys(card).length ? {
			title: text(header.title), subtitle: text(header.subtitle),
			facts: widgets.filter((widget) => widget.decoratedText).map((widget) => {
				const field = record(widget.decoratedText);
				return { label: text(field.topLabel), value: text(field.text) };
			}),
			button: text(item(record(widgets.find((widget) => widget.buttonList)?.buttonList).buttons).text),
		} : undefined };
	},
	discord: (payload) => {
		const value = record(payload);
		const card = item(value.embeds);
		return { text: text(value.content), author: text(value.username), card: Object.keys(card).length ? {
			title: text(card.title), text: text(card.description), facts: facts(card.fields, 'name'), color: hex(card.color),
		} : undefined };
	},
	mattermost: (payload) => attachment(record(payload), 'username'),
	rocket: (payload) => attachment(record(payload), 'alias'),
	webex: (payload) => {
		const value = record(payload);
		return { text: text(value.markdown) || text(value.text) };
	},
	ntfy: (payload) => {
		const value = record(payload);
		return { text: text(value.message), card: { title: text(value.title) },
			push: { topic: text(value.topic), priority: text(value.priority), tags: list(value.tags).map(text).filter(Boolean) } };
	},
	generic: () => ({}),
};
