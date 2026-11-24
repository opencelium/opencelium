import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { StatusPill } from '../shared/StatusPill';
import type { NotificationTestSend as TestSend } from './useNotificationTestSend';

type Props = { testSend: TestSend; disabledReason: string | null };

const summarizeBody = (body: unknown) => {
	const text = typeof body === 'string' ? body : body == null ? '' : JSON.stringify(body);
	return text.length > 120 ? `${text.slice(0, 120)}…` : text;
};

export function NotificationTestSend({ testSend, disabledReason }: Props) {
	const { t } = useI18n('workflow');
	const { result } = testSend;
	return (
		<div className='notificationTestSend'>
			<div className='notificationTestSendRow'>
				<Button onClick={testSend.send} loading={testSend.isSending} disabled={!!disabledReason}
					iconLeft='send' testId='notification-test-send'>
					{t('notification.test.button')}
				</Button>
				<span className='notificationFieldHelp'>{disabledReason ?? t('notification.test.hint')}</span>
			</div>
			{result && (
				<StatusPill tone={result.response.status < 400 ? 'success' : 'error'} testId='notification-test-result'>
					{t('notification.test.result', { status: result.response.status, duration: result.durationMs })}
					{summarizeBody(result.response.body) && ` · ${summarizeBody(result.response.body)}`}
				</StatusPill>
			)}
		</div>
	);
}
