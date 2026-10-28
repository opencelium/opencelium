import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { Select } from '@shared/ui/primitives/Select';
import { Textarea } from '@shared/ui/primitives/Textarea';
import { useAiNotificationDraft } from '../../notification/useAiNotificationDraft';

const LANGUAGES = [{ value: 'en' as const, label: 'English' }, { value: 'de' as const, label: 'Deutsch' }];

/** What the notification is for, in which language; then the draft to look at before it replaces subject and body. */
export function AiNotificationDraftPanel({ onClose }: { onClose: () => void }) {
	const { t } = useI18n('entities');
	const draft = useAiNotificationDraft();
	const { state } = draft;
	return (
		<div className="aiNotificationDraft" data-testid="ai-notification-draft">
			<label className="aiNotificationLabel">
				{t('notificationTemplate.aiDraft.instructionLabel')}
				<Textarea value={draft.instruction} placeholder={t('notificationTemplate.aiDraft.instructionPlaceholder')}
					onChange={(event) => draft.setInstruction(event.target.value)} testId="ai-notification-instruction" />
			</label>
			<div className="aiNotificationBar">
				<div className="aiNotificationLanguage">
					<Select value={draft.language} options={LANGUAGES} sortOptions={false} onChange={draft.setLanguage}
						testId="ai-notification-language" />
				</div>
				<Button type="primary" iconLeft="sparkles" onClick={() => void draft.draft()} loading={state.status === 'drafting'}
					disabled={!draft.instruction.trim()} testId="ai-notification-generate">{t('notificationTemplate.aiDraft.generate')}</Button>
				<Button type="text" onClick={onClose} testId="ai-notification-close">{t('notificationTemplate.aiDraft.close')}</Button>
			</div>
			{state.status === 'error' && <Alert type="error" showIcon message={t('notificationTemplate.aiDraft.failed')} />}
			{state.status === 'drafted' && (
				<div className="aiNotificationPreview" data-testid="ai-notification-preview">
					{state.draft.removedPlaceholders.length > 0 && (
						<Alert type="warning" showIcon message={t('notificationTemplate.aiDraft.removed', { names: state.draft.removedPlaceholders.join(', ') })} />
					)}
					<div className="aiNotificationLabel">{t('notificationTemplate.fields.subject.label')}</div>
					<div className="aiNotificationSubject">{state.draft.subject}</div>
					<div className="aiNotificationLabel">{t('notificationTemplate.fields.body.label')}</div>
					<pre className="aiNotificationBody">{state.draft.body}</pre>
					<div className="aiNotificationBar">
						<Button type="primary" onClick={draft.use} testId="ai-notification-use">{t('notificationTemplate.aiDraft.use')}</Button>
						<Button onClick={draft.discard} testId="ai-notification-discard">{t('notificationTemplate.aiDraft.discard')}</Button>
					</div>
				</div>
			)}
		</div>
	);
}
