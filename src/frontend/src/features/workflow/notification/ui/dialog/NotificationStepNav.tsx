import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Steps } from '@shared/ui/primitives/Steps';
import { getActiveDraft } from '../../model/notificationConfig';
import { isBodyOverridden, parseBody } from '../../model/notificationBody';
import type { NotificationDialogStep } from '../../model/notification.types';
import { getNotificationTool } from '../../tools/notificationTools';
import { useNotificationToolName } from '../useNotificationToolName';
import type { NotificationDialogState } from './useNotificationDialog';

type StepStatus = 'wait' | 'process' | 'finish' | 'error';

export function NotificationStepNav({ state }: { state: NotificationDialogState }) {
	const { t } = useI18n('workflow');
	const toolName = useNotificationToolName();
	const { config, step: current, hasTool } = state;
	const tool = config.tool ? getNotificationTool(config.tool) : null;
	const hasWebhook = !!getActiveDraft(config)?.webhookUrl.trim();
	const isBodyValid = parseBody(state.bodyText).ok;
	const messageSummary = !tool ? '—'
		: tool.isJsonOnly ? t('notification.steps.messageJson')
			: isBodyOverridden(config) ? t('notification.steps.messageOverridden') : t('notification.steps.messageEditor');

	const steps: { step: NotificationDialogStep; titleKey: string; summary: string; isDone: boolean; isError?: boolean }[] = [
		{ step: 1, titleKey: 'notification.steps.tool', summary: tool ? toolName(tool) : t('notification.steps.toolMissing'), isDone: hasTool },
		{ step: 2, titleKey: 'notification.steps.webhook', isDone: hasWebhook,
			summary: hasTool ? t(hasWebhook ? 'notification.steps.webhookSet' : 'notification.steps.webhookMissing') : '—' },
		{ step: 3, titleKey: 'notification.steps.message', summary: messageSummary, isDone: hasTool && isBodyValid,
			isError: hasTool && !isBodyValid },
		{ step: 4, titleKey: 'notification.steps.request', summary: tool ? `POST · ${tool.response.status}` : '—', isDone: false },
	];
	const statusOf = (item: (typeof steps)[number]): StepStatus => item.isError ? 'error'
		: item.step === current ? 'process' : item.isDone ? 'finish' : 'wait';

	return (
		<nav className='notificationStepNav' aria-label={t('notification.steps.ariaLabel')} data-testid='notification-dialog-steps'>
			<Steps compact current={current - 1} items={steps.map((item) => ({
				header: (
					<span className='notificationStepTitle' data-testid={`notification-dialog-step-${item.step}`}>
						{t(item.titleKey)}
						<small>{item.summary}</small>
					</span>
				),
				status: statusOf(item),
				disabled: item.step > 1 && !hasTool,
				onClick: () => state.goTo(item.step),
			}))} />
		</nav>
	);
}
