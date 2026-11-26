import { describe, expect, it } from 'vitest';
import { getNotificationTool, NOTIFICATION_TOOLS } from '../tools/notificationTools';
import {
	createNotificationConfig, normalizeNotificationConfig, selectTool, updateActiveDraft,
} from './notificationConfig';
import { buildEditorBodyText, countReferences, getBodyText, hasMessageContent, isBodyOverridden, parseBody } from './notificationBody';
import { validateWebhookUrl } from './webhookValidation';
import { buildNotificationMethodConfig, NOTIFICATION_CONTENT_TYPE } from './notificationMethodConfig';
import type { NotificationConfig } from './notification.types';

const REF = '{%#3fa9f5.(response).body.$.orderNumber%}';

const withMessage = (config: NotificationConfig, message: Record<string, unknown>) =>
	updateActiveDraft(config, (draft) => ({ ...draft, message: { ...draft.message, ...message } as typeof draft.message }));

describe('notification tool registry', () => {
	it('offers Slack, Teams and the generic webhook in display order', () => {
		expect(NOTIFICATION_TOOLS.map((tool) => tool.id)).toEqual(['slack', 'teams', 'generic']);
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

	it('builds a Teams Adaptive Card with facts, button and mention', () => {
		const body = getNotificationTool('teams').buildBody({ title: 'T', style: 'good', text: '', mention: 'a@b.c', fullWidth: true,
			facts: [{ id: 'f', label: 'L', value: 'V' }], buttonText: 'Open', buttonUrl: 'https://x' });
		expect(body).toMatchObject({ type: 'message', attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', content: {
			type: 'AdaptiveCard',
			body: [
				{ type: 'TextBlock', weight: 'Bolder', text: 'T', color: 'good' },
				{ type: 'FactSet', facts: [{ title: 'L', value: 'V' }] },
				{ type: 'TextBlock', text: '<at>a@b.c</at>' },
			],
			actions: [{ type: 'Action.OpenUrl', title: 'Open', url: 'https://x' }],
			msteams: { width: 'Full', entities: [{ type: 'mention', mentioned: { id: 'a@b.c' } }] },
		} }] });
	});

	it('lets a hand-edited JSON win until it is reset', () => {
		const config = selectTool(createNotificationConfig(), 'teams');
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
		let config = selectTool(createNotificationConfig(), 'slack');
		config = updateActiveDraft(config, (draft) => ({ ...draft, webhookUrl: 'https://hooks.slack.com/services/a' }));
		config = { ...config, extraHeaders: [{ id: 'h', name: 'X-Trace', value: REF }, { id: 'e', name: ' ', value: 'ignored' }] };
		const methodConfig = buildNotificationMethodConfig('n1', config);
		expect(methodConfig).toMatchObject({
			method: 'POST', url: 'https://hooks.slack.com/services/a', bodyFormat: 'json',
			headers: { 'Content-Type': NOTIFICATION_CONTENT_TYPE, 'X-Trace': REF },
		});
		expect(methodConfig.response?.success.status).toBe('200');
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
	});

	it('drops the on-error and 429 settings older steps were saved with', () => {
		const config = normalizeNotificationConfig({ tool: 'slack', errorPolicy: 'retry', retryOn429: false });
		expect(config).not.toHaveProperty('errorPolicy');
		expect(config).not.toHaveProperty('retryOn429');
	});
});

describe('hasMessageContent', () => {
	it('needs the Slack notification text', () => {
		const config = selectTool(createNotificationConfig(), 'slack');
		expect(hasMessageContent(config)).toBe(false);
		expect(hasMessageContent(withMessage(config, { header: 'Only a heading' }))).toBe(false);
		expect(hasMessageContent(withMessage(config, { text: '  ' }))).toBe(false);
		expect(hasMessageContent(withMessage(config, { text: 'Order shipped' }))).toBe(true);
	});

	it('accepts a Teams title or text', () => {
		const config = selectTool(createNotificationConfig(), 'teams');
		expect(hasMessageContent(config)).toBe(false);
		expect(hasMessageContent(withMessage(config, { title: 'T' }))).toBe(true);
	});

	it('judges hand-edited JSON by its strings, not its flags', () => {
		const config = selectTool(createNotificationConfig(), 'generic');
		expect(hasMessageContent(config)).toBe(false);
		const edit = (json: string) => updateActiveDraft(config, (draft) => ({ ...draft, jsonOverride: json }));
		expect(hasMessageContent(edit('{"text":"","unfurl_links":false}'))).toBe(false);
		expect(hasMessageContent(edit('{"event":"order.created"}'))).toBe(true);
	});
});

describe('editor values', () => {
	it('drops the spacer a reference chip leaves at the end of a value', () => {
		const config = withMessage(selectTool(createNotificationConfig(), 'slack'), {
			text: 'Hi {{global.name}} ', buttonText: 'Open', buttonUrl: '{{global.url}} ',
			facts: [{ id: 'f', label: ' Token ', value: '321 ' }],
		});
		expect(parseBody(getBodyText(config))).toMatchObject({ ok: true, value: {
			text: 'Hi {{global.name}}',
			blocks: [
				{ type: 'section', fields: [{ text: '*Token*\n321' }] },
				{ type: 'actions', elements: [{ url: '{{global.url}}' }] },
			],
		} });
	});
});
