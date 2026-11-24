import { useI18n } from '@shared/i18n/hooks/useI18n';
import { getActiveDraft } from '../../../model/notificationConfig';
import { validateWebhookUrl } from '../../../model/webhookValidation';
import type { NotificationTool } from '../../../tools/notificationTool.types';
import { ReferenceTextField } from '../../references/ReferenceTextField';
import { useNotificationToolName } from '../../useNotificationToolName';
import type { NotificationDialogState } from '../../dialog/useNotificationDialog';
import { WebhookValidationStatus } from './WebhookValidationStatus';
import { parseBody } from '../../../model/notificationBody';
import { NotificationTestSend } from '../../test/NotificationTestSend';
import type { NotificationTestSend as TestSend } from '../../test/useNotificationTestSend';

type Props = { state: NotificationDialogState; tool: NotificationTool; testSend: TestSend };

export function WebhookStep({ state, tool, testSend }: Props) {
	const { t } = useI18n('workflow');
	const toolName = useNotificationToolName();
	const url = getActiveDraft(state.config)?.webhookUrl ?? '';
	const disabledReason = !url.trim() ? t('notification.test.noUrl')
		: !parseBody(state.bodyText).ok ? t('notification.test.invalidJson') : null;
	return (
		<section>
			<h2 className='notificationSectionTitle'>{t('notification.webhook.title', { tool: toolName(tool) })}</h2>
			<p className='notificationLead'>{t('notification.webhook.lead')}</p>
			<div className='notificationField'>
				<label className='notificationFieldLabel' htmlFor='notification-webhook-url'>{t('notification.webhook.urlLabel')}</label>
				<ReferenceTextField id='notification-webhook-url' value={url} onChange={state.setWebhookUrl}
					placeholder={tool.webhook.placeholder} ariaLabel={t('notification.webhook.urlLabel')}
					testId='notification-webhook-url' />
				<WebhookValidationStatus tool={tool} validation={validateWebhookUrl(tool, url)} />
			</div>
			<NotificationTestSend testSend={testSend} disabledReason={disabledReason} />
		</section>
	);
}
