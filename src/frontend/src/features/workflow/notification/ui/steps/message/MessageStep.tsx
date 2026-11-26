import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert } from '@shared/ui/primitives/Alert';
import { Button } from '@shared/ui/primitives/Button';
import { getActiveDraft } from '../../../model/notificationConfig';
import { isBodyOverridden } from '../../../model/notificationBody';
import type { NotificationTool } from '../../../tools/notificationTool.types';
import type { NotificationDialogState } from '../../dialog/useNotificationDialog';
import { MessageToolbar } from './MessageToolbar';
import { MessageFields } from './MessageFields';
import { MessageJsonEditor } from './MessageJsonEditor';

type Props = { state: NotificationDialogState; tool: NotificationTool };

export function MessageStep({ state, tool }: Props) {
	const { t } = useI18n('workflow');
	const mode = tool.isJsonOnly ? 'json' : state.config.mode;
	const isOverridden = isBodyOverridden(state.config);
	const draft = getActiveDraft(state.config);
	const values = draft?.message ?? {};
	// Until the JSON is edited it is the editor's output, and the editor fields carry the transformations.
	const hasJsonOverride = draft?.jsonOverride !== undefined;
	const resetButton = (labelKey: string) => (
		<Button onClick={state.resetOverride} testId='notification-message-reset-override'>{t(labelKey)}</Button>
	);

	return (
		<section>
			<MessageToolbar mode={mode} tool={tool} bodyText={state.bodyText} onModeChange={state.setMode} />
			{mode === 'editor' ? (
				<>
					{isOverridden && (
						<Alert type='warning' showIcon className='notificationBanner' message={t('notification.message.lockedBanner')}
							action={resetButton('notification.message.discardOverride')} />
					)}
					<div className={isOverridden ? 'notificationLocked' : undefined} aria-disabled={isOverridden || undefined}
						data-testid='notification-message-editor'>
						<MessageFields layout={tool.fields} values={values} isDisabled={isOverridden} onChange={state.setMessageValue} />
					</div>
				</>
			) : (
				<>
					{isOverridden && (
						<Alert type='warning' showIcon className='notificationBanner' message={t('notification.message.overriddenBanner')}
							action={resetButton('notification.message.regenerate')} />
					)}
					<MessageJsonEditor value={state.bodyText} onChange={state.setJsonOverride} canTransform={hasJsonOverride} />
				</>
			)}
		</section>
	);
}
