import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { Aggregator } from '@entities/notificationTemplate/model/types';
import { useFetchEntitiesQuery } from '@shared/api/genericApi';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useDraftNotificationMutation } from '../api/aiApi';
import { notifyAiApplied } from '../ui/AiProposal/notifyAiApplied';
import type { NotificationDraft } from '../model/aiGateway.types';

export type NotificationDraftState =
	| { status: 'idle' }
	| { status: 'drafting' }
	| { status: 'drafted'; draft: NotificationDraft }
	| { status: 'error' };

/** The placeholders a template may use: the arguments of its selected aggregator, as the editors write them. */
export function placeholdersOf(aggregator: Aggregator | undefined): { token: string; description: string }[] {
	if (!aggregator?.active) return [];
	return aggregator.args.map((arg) => ({ token: `{{${aggregator.name}.${arg.name}}}`, description: arg.description ?? '' }));
}

/**
 * Drafts the notification template's subject and body from the wizard form: its name, message type, the selected
 * aggregator's arguments as placeholders, and the texts already written. Using the draft writes both fields through
 * the form, so validation and saving treat them like typed text.
 */
export function useAiNotificationDraft() {
	const { t, lang } = useI18n('entities');
	const { getValues, setValue } = useFormContext();
	const { data: aggregators = [] } = useFetchEntitiesQuery('/aggregator/all');
	const [draftNotification] = useDraftNotificationMutation();
	const [state, setState] = useState<NotificationDraftState>({ status: 'idle' });
	const [instruction, setInstruction] = useState('');
	const [language, setLanguage] = useState<'en' | 'de'>(lang.startsWith('de') ? 'de' : 'en');

	const draft = async () => {
		if (!instruction.trim()) return;
		setState({ status: 'drafting' });
		const aggregatorId = getValues('aggregator') as number | null | undefined;
		const aggregator = (aggregators as Aggregator[]).find((candidate) => candidate.id === aggregatorId);
		try {
			const result = await draftNotification({
				language, instruction: instruction.trim(),
				type: String(getValues('type') ?? ''), templateName: String(getValues('name') ?? ''),
				placeholders: placeholdersOf(aggregator),
				current: { subject: String(getValues('subject') ?? ''), body: String(getValues('body') ?? '') },
			}).unwrap();
			setState({ status: 'drafted', draft: result });
		} catch {
			setState({ status: 'error' });
		}
	};

	const use = () => {
		if (state.status !== 'drafted') return;
		const options = { shouldDirty: true, shouldValidate: true, shouldTouch: true };
		const before = { subject: getValues('subject') as unknown, body: getValues('body') as unknown };
		setValue('subject', state.draft.subject, options);
		setValue('body', state.draft.body, options);
		setState({ status: 'idle' });
		notifyAiApplied({ key: 'ai-notification-applied', undoTestId: 'ai-notification-undo', text: t('notification-template.aiDraft.applied'),
			onUndo: () => {
				setValue('subject', before.subject, options);
				setValue('body', before.body, options);
			} });
	};

	return { state, instruction, setInstruction, language, setLanguage, draft, use, discard: () => setState({ status: 'idle' }) };
}
