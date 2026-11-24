import { describe, expect, it } from 'vitest';
import { getNotificationTool, NOTIFICATION_TOOLS } from '../tools/notificationTools';
import {
	createNotificationConfig, normalizeNotificationConfig, selectTool, updateActiveDraft,
} from './notificationConfig';
import { buildEditorBodyText, countReferences, getBodyText, isBodyOverridden, parseBody } from './notificationBody';
import { validateWebhookUrl } from './webhookValidation';
import { buildNotificationMethodConfig, NOTIFICATION_CONTENT_TYPE } from './notificationMethodConfig';
import type { NotificationConfig } from './notification.types';

const REF = '{%#3fa9f5.(response).body.$.orderNumber%}';

const withMessage = (config: NotificationConfig, message: Record<string, unknown>) =>
	updateActiveDraft(config, (draft) => ({ ...draft, message: { ...draft.message, ...message } as typeof draft.message }));

describe('notification tool registry', () => {
	it('offers the nine v1 tools in display order', () => {
		expect(NOTIFICATION_TOOLS.map((tool) => tool.id)).toEqual(
			['slack', 'teams', 'google-chat', 'discord', 'mattermost', 'rocket-chat', 'webex', 'ntfy', 'generic']);
	});

	it.each(NOTIFICATION_TOOLS.filter((tool) => !tool.isJsonOnly))('$id builds valid JSON from its defaults and previews it', (tool) => {
		const body = tool.buildBody(tool.createDefaults());
		expect(() => JSON.parse(JSON.stringify(body))).not.toThrow();
		expect(() => tool.toPreview(body)).not.toThrow();
	});
});

describe('notification body', () => {
	it('builds the Slack Block Kit payload from the editor fields', () => {
		const config = withMessage(selectTool(createNotificationConfig(), 'slack'), {
			text: `New order ${REF}`, header: 'New order', body: '*bold*',
			facts: [{ id: 'f1', label: 'Order', value: REF }], buttonText: 'Open', buttonUrl: 'https://x',
		});
		const body = parseBody(getBodyText(config));
		expect(body).toEqual({ ok: true, value: {
			text: `New order ${REF}`,
			blocks: [
				{ type: 'header', text: { type: 'plain_text', text: 'New order' } },
				{ type: 'section', text: { type: 'mrkdwn', text: '*bold*' }, fields: [{ type: 'mrkdwn', text: `*Order*\n${REF}` }] },
				{ type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Open' }, url: 'https://x' }] },
			],
			unfurl_links: false,
		} });
		expect(countReferences(getBodyText(config))).toBe(2);
	});

	it('serializes Discord colours as integers and ntfy tags as a list', () => {
		const discord = getNotificationTool('discord').buildBody({ title: 'T', color: '#5865f2', facts: [] });
		expect(discord).toEqual({ embeds: [{ title: 'T', color: 0x5865f2 }] });
		const ntfy = getNotificationTool('ntfy').buildBody({ topic: 't', title: '', message: 'm', priority: '4', tags: 'a, b,', click: '' });
		expect(ntfy).toEqual({ topic: 't', title: '', message: 'm', priority: 4, tags: ['a', 'b'] });
	});

	it('lets a hand-edited JSON win until it is reset', () => {
		const config = selectTool(createNotificationConfig(), 'webex');
		const edited = updateActiveDraft(config, (draft) => ({ ...draft, jsonOverride: '{"text":"x"}' }));
		expect(isBodyOverridden(edited)).toBe(true);
		expect(getBodyText(edited)).toBe('{"text":"x"}');
		expect(getBodyText(config)).toBe(buildEditorBodyText(config));
	});

	it('reports the parser error for invalid JSON', () => {
		const result = parseBody('{"a":');
		expect(result.ok).toBe(false);
	});

	it('starts the generic webhook in JSON and never reports it as overridden', () => {
		const config = selectTool(createNotificationConfig(), 'generic');
		expect(parseBody(getBodyText(config)).ok).toBe(true);
		expect(isBodyOverridden(config)).toBe(false);
	});
});

describe('switching tools', () => {
	it('keeps webhook URL, message and JSON override per tool', () => {
		let config = selectTool(createNotificationConfig(), 'slack');
		config = updateActiveDraft(config, (draft) => ({ ...draft, webhookUrl: 'https://hooks.slack.com/services/A', jsonOverride: '{}' }));
		config = selectTool(config, 'teams');
		config = updateActiveDraft(config, (draft) => ({ ...draft, webhookUrl: 'https://x.logic.azure.com/w' }));
		config = selectTool(config, 'slack');
		expect(config.tools.slack).toMatchObject({ webhookUrl: 'https://hooks.slack.com/services/A', jsonOverride: '{}' });
		expect(config.tools.teams?.webhookUrl).toBe('https://x.logic.azure.com/w');
	});
});

describe('webhook validation', () => {
	const slack = getNotificationTool('slack');
	it.each([
		['', 'empty'],
		[`https://${REF}`, 'reference'],
		['https://hooks.slack.com/services/T/B/x', 'match'],
		['https://example.com/hook', 'mismatch'],
	])('%s → %s', (url, expected) => expect(validateWebhookUrl(slack, url)).toBe(expected));
});

describe('derived HTTP request', () => {
	it('is a JSON POST to the webhook with the fixed content type and extra headers', () => {
		let config = selectTool(createNotificationConfig(), 'google-chat');
		config = updateActiveDraft(config, (draft) => ({ ...draft, webhookUrl: 'https://chat.googleapis.com/v1/spaces/a' }));
		config = { ...config, extraHeaders: [{ id: 'h', name: 'X-Trace', value: REF }, { id: 'e', name: ' ', value: 'ignored' }] };
		const methodConfig = buildNotificationMethodConfig('n1', config);
		expect(methodConfig).toMatchObject({
			method: 'POST', url: 'https://chat.googleapis.com/v1/spaces/a', bodyFormat: 'json',
			headers: { 'Content-Type': NOTIFICATION_CONTENT_TYPE, 'X-Trace': REF },
		});
		// The documented response seeds the reference picker of later steps.
		expect(methodConfig.response?.success.body.fields).toMatchObject({ thread: { name: expect.any(String) } });
	});
});

describe('normalizeNotificationConfig', () => {
	it('falls back to defaults for unknown shapes and drops unknown tools', () => {
		expect(normalizeNotificationConfig('nope')).toEqual(createNotificationConfig());
		const config = normalizeNotificationConfig({ tool: 'pager', tools: { pager: {}, slack: { webhookUrl: 'u', message: { text: 1 } } },
			errorPolicy: 'explode', retryOn429: 'yes' });
		expect(config.tool).toBeNull();
		expect(Object.keys(config.tools)).toEqual(['slack']);
		expect(config.tools.slack?.webhookUrl).toBe('u');
		expect(config.errorPolicy).toBe('stop');
		expect(config.retryOn429).toBe(true);
	});
});
