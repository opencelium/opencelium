import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Icon } from '@shared/ui/primitives/Icon';
import { Tabs } from '@shared/ui/primitives/Tabs';
import { getActiveDraft } from '../../model/notificationConfig';
import { hasMessageContent, isBodyOverridden, parseBody } from '../../model/notificationBody';
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
		{ step: 3, titleKey: 'notification.steps.message', summary: messageSummary, isDone: hasTool && isBodyValid && hasMessageContent(config),
			isError: hasTool && !isBodyValid },
		{ step: 4, titleKey: 'notification.steps.request', summary: tool ? `POST · ${tool.response.status}` : '—', isDone: false },
	];
	const statusOf = (item: (typeof steps)[number]): StepStatus => item.isError ? 'error'
		: item.step === current ? 'process' : item.isDone ? 'finish' : 'wait';

	return (
		<nav className='notificationStepNav' aria-label={t('notification.steps.ariaLabel')} data-testid='notification-dialog-steps'>
			<Tabs value={String(current)} onChange={(key) => state.goTo(Number(key) as NotificationDialogStep)}
				items={steps.map((item) => {
					const status = statusOf(item);
					return {
						key: String(item.step),
						disabled: item.step > 1 && !hasTool,
						content: null,
						label: (
							<span className={`notificationStepTab notificationStepTab--${status}`}
								data-testid={`notification-dialog-step-${item.step}`}>
								<span className='notificationStepNumber' aria-hidden='true'>
									{status === 'finish' ? <Icon name='check' size={12} color='inherit' /> : item.step}
								</span>
								<span className='notificationStepName'>{t(item.titleKey)}</span>
								{item.summary !== '—' && <span className='notificationStepSummary'>{item.summary}</span>}
							</span>
						),
					};
				})} />
		</nav>
	);
}
