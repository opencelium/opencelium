import { createShortId } from '@shared/lib/createId';
import { getNotificationTool, isNotificationToolId } from '../tools/notificationTools';
import { isRecord } from '../tools/toolValues';
import type {
	NotificationConfig, NotificationFact, NotificationFieldValue, NotificationHeader,
	NotificationMessageValues, NotificationToolDraft, NotificationToolId,
} from './notification.types';

export const createNotificationConfig = (): NotificationConfig => ({
	tool: null, tools: {}, mode: 'editor', extraHeaders: [],
});

export const createToolDraft = (toolId: NotificationToolId): NotificationToolDraft => {
	const tool = getNotificationTool(toolId);
	return {
		webhookUrl: '',
		message: tool.createDefaults(),
		...(tool.isJsonOnly ? { jsonOverride: JSON.stringify({ text: '' }, null, 2) } : {}),
	};
};

export const getToolDraft = (config: NotificationConfig, toolId: NotificationToolId): NotificationToolDraft =>
	config.tools[toolId] ?? createToolDraft(toolId);

export const getActiveDraft = (config: NotificationConfig): NotificationToolDraft | null =>
	config.tool ? getToolDraft(config, config.tool) : null;

export const selectTool = (config: NotificationConfig, toolId: NotificationToolId): NotificationConfig => ({
	...config,
	tool: toolId,
	tools: { ...config.tools, [toolId]: getToolDraft(config, toolId) },
});

export const updateActiveDraft = (
	config: NotificationConfig,
	update: (draft: NotificationToolDraft) => NotificationToolDraft,
): NotificationConfig => {
	if (!config.tool) return config;
	return { ...config, tools: { ...config.tools, [config.tool]: update(getToolDraft(config, config.tool)) } };
};

export const createFact = (): NotificationFact => ({ id: createShortId('fact'), label: '', value: '' });

export const createHeader = (): NotificationHeader => ({ id: createShortId('header'), name: '', value: '' });

const normalizeFact = (value: unknown): NotificationFact | null => isRecord(value) ? {
	id: typeof value.id === 'string' ? value.id : createShortId('fact'),
	label: typeof value.label === 'string' ? value.label : '',
	value: typeof value.value === 'string' ? value.value : '',
} : null;

const normalizeFieldValue = (value: unknown): NotificationFieldValue | null => {
	if (typeof value === 'string' || typeof value === 'boolean') return value;
	if (Array.isArray(value)) return value.map(normalizeFact).filter((fact): fact is NotificationFact => !!fact);
	return null;
};

const normalizeMessage = (value: unknown): NotificationMessageValues => {
	if (!isRecord(value)) return {};
	return Object.fromEntries(Object.entries(value)
		.map(([name, field]) => [name, normalizeFieldValue(field)] as const)
		.filter((entry): entry is [string, NotificationFieldValue] => entry[1] !== null));
};

const normalizeDraft = (toolId: NotificationToolId, value: unknown): NotificationToolDraft => {
	const fallback = createToolDraft(toolId);
	if (!isRecord(value)) return fallback;
	return {
		webhookUrl: typeof value.webhookUrl === 'string' ? value.webhookUrl : '',
		message: { ...fallback.message, ...normalizeMessage(value.message) },
		...(typeof value.jsonOverride === 'string' ? { jsonOverride: value.jsonOverride } : {}),
	};
};

/** Reads a saved or imported blob; anything unrecognised falls back to defaults rather than failing the load. */
export const normalizeNotificationConfig = (value: unknown): NotificationConfig => {
	const fallback = createNotificationConfig();
	if (!isRecord(value)) return fallback;
	const tools = isRecord(value.tools)
		? Object.fromEntries(Object.entries(value.tools).filter(([id]) => isNotificationToolId(id))
			.map(([id, draft]) => [id, normalizeDraft(id as NotificationToolId, draft)]))
		: {};
	return {
		tool: isNotificationToolId(value.tool) ? value.tool : null,
		tools,
		mode: value.mode === 'json' ? 'json' : 'editor',
		extraHeaders: Array.isArray(value.extraHeaders) ? value.extraHeaders.filter(isRecord).map((header) => ({
			id: typeof header.id === 'string' ? header.id : createShortId('header'),
			name: typeof header.name === 'string' ? header.name : '',
			value: typeof header.value === 'string' ? header.value : '',
		})) : [],
	};
};
