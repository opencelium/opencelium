import type { NotificationTool, NotificationToolDraft } from '../nodes/NotificationNode/notificationTools';

type Message = NotificationToolDraft['message'];
type Field = { key: string; options?: readonly string[]; area?: boolean; toggle?: boolean };
const line = (key: string): Field => ({ key });
const area = (key: string): Field => ({ key, area: true });
const toggle = (key: string): Field => ({ key, toggle: true });
const choice = (key: string, ...options: string[]): Field => ({ key, options });
const facts = line('facts');
const button = [line('btnText'), line('btnUrl')];
const content = (message: Message, key: string) => {
	const value = message[key];
	return typeof value === 'string' ? value : '';
};
const pairs = ({ facts }: Message) => Array.isArray(facts) ? facts.filter(([key, value]) => key || value) : [];
const optional = (key: string, value: unknown) => value ? { [key]: value } : {};

export const notificationMessage: Record<NotificationTool, {
	fields: Field[];
	build: (message: Message) => Record<string, unknown>;
}> = {
	slack: {
		fields: [area('text'), line('header'), area('body'), facts, ...button, toggle('unfurl')],
		build: (message) => {
			const { header, body, btnText, btnUrl } = message;
			const fields = pairs(message).map(([key, value]) => ({ type: 'mrkdwn', text: '*' + key + '*\n' + value }));
			const blocks = [
				header && { type: 'header', text: { type: 'plain_text', text: header } },
				(body || fields.length) && { type: 'section', text: { type: 'mrkdwn', text: body || ' ' },
					...optional('fields', fields.length ? fields : undefined) },
				btnText && btnUrl && { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: btnText }, url: btnUrl }] },
			].filter(Boolean);
			return { text: content(message, 'text'), ...optional('blocks', blocks.length ? blocks : undefined), unfurl_links: !!message.unfurl };
		},
	},
	teams: {
		fields: [line('title'), choice('style', 'default', 'accent', 'good', 'warning', 'attention'),
			area('text'), facts, ...button, line('mention'), toggle('full')],
		build: (message) => {
			const { title, style, text, btnText, btnUrl, mention, full } = message;
			const fields = pairs(message).map(([key, value]) => ({ title: key, value }));
			const mentionText = '<at>' + mention + '</at>';
			const body = [
				title && { type: 'TextBlock', size: 'Large', weight: 'Bolder', text: title, color: style || 'default', wrap: true },
				text && { type: 'TextBlock', text, wrap: true },
				fields.length && { type: 'FactSet', facts: fields },
				mention && { type: 'TextBlock', text: mentionText, wrap: true },
			].filter(Boolean);
			const msteams = {
				...optional('width', full && 'Full'),
				...optional('entities', mention && [{ type: 'mention', text: mentionText, mentioned: { id: mention, name: mention } }]),
			};
			const card = {
				$schema: 'http://adaptivecards.io/schemas/adaptive-card.json', type: 'AdaptiveCard', version: '1.4', body,
				...optional('actions', btnText && btnUrl && [{ type: 'Action.OpenUrl', title: btnText, url: btnUrl }]),
				...optional('msteams', Object.keys(msteams).length ? msteams : undefined),
			};
			return { type: 'message', attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', contentUrl: null, content: card }] };
		},
	},
	gchat: {
		fields: [area('text'), line('title'), line('subtitle'), facts, ...button, line('threadKey')],
		build: (message) => {
			const { text, title, subtitle, btnText, btnUrl, threadKey } = message;
			const decorated = pairs(message).map(([key, value]) => ({ decoratedText: { topLabel: key, text: value } }));
			const widgets = btnText && btnUrl
				? [...decorated, { buttonList: { buttons: [{ text: btnText, onClick: { openLink: { url: btnUrl } } }] } }]
				: decorated;
			return {
				...optional('text', text),
				...optional('cardsV2', (title || widgets.length) && [{ cardId: 'oc-notification', card: {
					header: { title: title || '', subtitle: subtitle || '' }, sections: [{ widgets }],
				} }]),
				...optional('thread', threadKey && { threadKey }),
			};
		},
	},
	discord: {
		fields: [area('content'), line('username'), line('avatar'), line('title'), line('color'), area('desc'), facts, line('url')],
		build: (message) => {
			const { content: text, username, avatar, title, url, desc } = message;
			const color = content(message, 'color');
			const fields = pairs(message).map(([name, value]) => ({ name, value, inline: true }));
			const embed = { ...optional('title', title), ...optional('url', url), ...optional('description', desc),
				...(/^#[0-9a-f]{6}$/i.test(color) ? { color: Number.parseInt(color.slice(1), 16) } : {}),
				...optional('fields', fields.length ? fields : undefined) };
			return { ...optional('content', text), ...optional('username', username), ...optional('avatar_url', avatar),
				...optional('embeds', Object.keys(embed).length ? [embed] : undefined) };
		},
	},
	mattermost: {
		fields: [area('text'), line('channel'), choice('priority', '', 'important', 'urgent'),
			line('username'), line('icon'), line('attTitle'), line('color'), facts],
		build: (message) => {
			const { channel, username, icon, priority, attTitle, color } = message;
			const fields = pairs(message).map(([title, value]) => ({ short: true, title, value }));
			return { text: content(message, 'text'), ...optional('channel', channel), ...optional('username', username),
				...optional('icon_url', icon), ...optional('priority', priority && { priority }),
				...optional('attachments', (attTitle || fields.length) && [{ color, title: attTitle, fields }]) };
		},
	},
	rocket: {
		fields: [area('text'), line('alias'), line('emoji'), line('attTitle'), line('color'), area('attText'), facts],
		build: (message) => {
			const { alias, emoji, attTitle, attText, color } = message;
			const fields = pairs(message).map(([title, value]) => ({ short: true, title, value }));
			return { text: content(message, 'text'), ...optional('alias', alias), ...optional('emoji', emoji),
				...optional('attachments', (attTitle || attText || fields.length) && [{ title: attTitle, text: attText, color, fields }]) };
		},
	},
	webex: {
		fields: [choice('format', 'markdown', 'text'), area('body')],
		build: (message) => ({ [message.format === 'text' ? 'text' : 'markdown']: content(message, 'body') }),
	},
	ntfy: {
		fields: [line('topic'), choice('priority', '3', '1', '2', '4', '5'), line('title'), area('message'),
			line('tags'), line('click'), toggle('markdown')],
		build: (message) => {
			const tags = content(message, 'tags').split(',').map((tag) => tag.trim()).filter(Boolean);
			return { topic: content(message, 'topic'), title: content(message, 'title'), message: content(message, 'message'),
				priority: Number(message.priority || 3), ...optional('tags', tags.length ? tags : undefined),
				...optional('click', message.click), ...optional('markdown', !!message.markdown) };
		},
	},
	generic: { fields: [], build: () => ({}) },
};
