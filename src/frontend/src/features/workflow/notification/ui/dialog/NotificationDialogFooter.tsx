import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import type { NotificationDialogStep } from '../../model/notification.types';

type Props = {
	step: NotificationDialogStep;
	hasTool: boolean;
	isReadOnly?: boolean;
	onBack: () => void;
	onNext: () => void;
	onCancel: () => void;
	onApply: () => void;
};

export function NotificationDialogFooter({ step, hasTool, isReadOnly, onBack, onNext, onCancel, onApply }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className='notificationDialogFooter'>
			<Button onClick={onBack} disabled={step === 1} testId='notification-dialog-back'>{t('notification.dialog.back')}</Button>
			<span className='notificationDialogFooterSpacer' />
			<Button onClick={onCancel} testId='notification-dialog-cancel'>{t('actions.cancel')}</Button>
			{step < 4 && (
				<Button type='primary' onClick={onNext} disabled={!hasTool} testId='notification-dialog-next'>
					{t('notification.dialog.next')}
				</Button>
			)}
			{!isReadOnly && (
				<Button type={step === 4 ? 'primary' : 'default'} onClick={onApply} testId='notification-dialog-apply'>
					{t('actions.apply')}
				</Button>
			)}
		</div>
	);
}
