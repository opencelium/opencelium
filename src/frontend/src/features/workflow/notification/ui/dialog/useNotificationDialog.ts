import { useCallback, useState } from 'react';
import { createHeader, normalizeNotificationConfig, selectTool, updateActiveDraft } from '../../model/notificationConfig';
import type {
	NotificationConfig, NotificationDialogStep, NotificationDialogTarget, NotificationEditMode,
	NotificationFieldValue, NotificationHeader, NotificationRequestSection, NotificationToolId,
} from '../../model/notification.types';
import { getBodyText, parseBody } from '../../model/notificationBody';

export type NotificationRequestTab = 'request' | 'response';

/** A section to scroll to and flash; the nonce re-triggers it when the same section is asked for twice. */
export type NotificationSectionFocus = { section: NotificationRequestSection; nonce: number };

const initialStep = (target: NotificationDialogTarget, hasTool: boolean): NotificationDialogStep => {
	if (!hasTool) return 1;
	switch (target.kind) {
		case 'step': return target.step;
		case 'request':
		case 'response': return 4;
		case 'default':
		case 'rename': return 3;
		default: {
			const _exhaustive: never = target;
			return _exhaustive;
		}
	}
};

type Args = { rawConfig: unknown; initialLabel: string; target: NotificationDialogTarget };

export const useNotificationDialog = ({ rawConfig, initialLabel, target }: Args) => {
	const [config, setConfig] = useState<NotificationConfig>(() => normalizeNotificationConfig(rawConfig));
	const [label, setLabel] = useState(initialLabel);
	const [step, setStep] = useState<NotificationDialogStep>(() => initialStep(target, !!config.tool));
	const [requestTab, setRequestTab] = useState<NotificationRequestTab>(target.kind === 'response' ? 'response' : 'request');
	const [sectionFocus, setSectionFocus] = useState<NotificationSectionFocus | null>(
		target.kind === 'request' && config.tool ? { section: target.section, nonce: 0 } : null);
	const hasTool = !!config.tool;
	const clearSectionFocus = useCallback(() => setSectionFocus(null), []);

	const updateDraft = (update: Parameters<typeof updateActiveDraft>[1]) =>
		setConfig((current) => updateActiveDraft(current, update));
	const updateHeaders = (update: (headers: NotificationHeader[]) => NotificationHeader[]) =>
		setConfig((current) => ({ ...current, extraHeaders: update(current.extraHeaders) }));
	const goTo = (next: NotificationDialogStep) => setStep(hasTool ? next : 1);

	return {
		config, label, step, requestTab, sectionFocus, hasTool,
		bodyText: getBodyText(config),
		setLabel,
		goTo,
		next: () => goTo(Math.min(4, step + 1) as NotificationDialogStep),
		back: () => goTo(Math.max(1, step - 1) as NotificationDialogStep),
		setRequestTab,
		clearSectionFocus,
		selectTool: (toolId: NotificationToolId) => setConfig((current) => selectTool(current, toolId)),
		setWebhookUrl: (webhookUrl: string) => updateDraft((draft) => ({ ...draft, webhookUrl })),
		setMessageValue: (key: string, value: NotificationFieldValue) =>
			updateDraft((draft) => ({ ...draft, message: { ...draft.message, [key]: value } })),
		setMode: (mode: NotificationEditMode) => setConfig((current) => ({ ...current, mode })),
		setJsonOverride: (jsonOverride: string) => updateDraft((draft) => ({ ...draft, jsonOverride })),
		resetOverride: () => updateDraft((draft) => {
			const next = { ...draft };
			delete next.jsonOverride;
			return next;
		}),
		addHeader: () => updateHeaders((headers) => [...headers, createHeader()]),
		updateHeader: (id: string, patch: Partial<Omit<NotificationHeader, 'id'>>) =>
			updateHeaders((headers) => headers.map((header) => header.id === id ? { ...header, ...patch } : header)),
		removeHeader: (id: string) => updateHeaders((headers) => headers.filter((header) => header.id !== id)),
		isBodyValid: () => !hasTool || parseBody(getBodyText(config)).ok,
	};
};

export type NotificationDialogState = ReturnType<typeof useNotificationDialog>;
