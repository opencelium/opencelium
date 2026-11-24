import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WebhookValidation } from '../../../model/webhookValidation';
import type { NotificationTool } from '../../../tools/notificationTool.types';
import { useNotificationToolName } from '../../useNotificationToolName';
import { StatusPill } from '../../shared/StatusPill';

type Props = { tool: NotificationTool; validation: WebhookValidation };

export function WebhookValidationStatus({ tool, validation }: Props) {
	const { t } = useI18n('workflow');
	const name = useNotificationToolName()(tool);
	const testId = `notification-webhook-validation-${validation}`;
	switch (validation) {
		case 'empty': return <StatusPill tone='warning' testId={testId}>{t('notification.webhook.validation.empty')}</StatusPill>;
		case 'reference': return <StatusPill tone='success' testId={testId}>{t('notification.webhook.validation.reference')}</StatusPill>;
		case 'match': return <StatusPill tone='success' testId={testId}>{t('notification.webhook.validation.match', { tool: name })}</StatusPill>;
		case 'mismatch': return (
			<StatusPill tone='warning' testId={testId}>
				{t('notification.webhook.validation.mismatch', { tool: name, example: tool.webhook.placeholder })}
			</StatusPill>
		);
		default: {
			const _exhaustive: never = validation;
			return _exhaustive;
		}
	}
}
