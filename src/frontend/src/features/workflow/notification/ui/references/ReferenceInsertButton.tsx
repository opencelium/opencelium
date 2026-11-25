import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useNotificationReferences } from './notificationReferenceContextValue';

type Props = { pickerId: string; testId: string; disabled?: boolean; onBeforeOpen?: () => void };

export function ReferenceInsertButton({ pickerId, testId, disabled, onBeforeOpen }: Props) {
	const { t } = useI18n('workflow');
	const { currentMethod, activePickerId, setActivePickerId } = useNotificationReferences();
	const isOpen = activePickerId === pickerId;
	return (
		<Tooltip content={t('actions.insertReference')}>
			<IconButton type='text' size='sm' iconProps={{ name: 'link', size: 14 }} testId={testId}
				disabled={disabled || !currentMethod}
				onClick={() => {
					onBeforeOpen?.();
					setActivePickerId(isOpen ? null : pickerId);
				}} />
		</Tooltip>
	);
}
