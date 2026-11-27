import type { Ref } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Input } from '@shared/ui/primitives/Input';
import { Icon } from '@shared/ui/primitives/Icon';
import { DocsLink } from '@shared/ui/actions/DocsLink';
import type { NotificationToolId } from '../../model/notification.types';
import { getNotificationTool } from '../../tools/notificationTools';
import { NotificationToolMark } from '../NotificationToolMark';

type Props = {
	color?: string;
	toolId: NotificationToolId | null;
	label: string;
	inputRef: Ref<HTMLInputElement>;
	isReadOnly?: boolean;
	onLabelChange: (label: string) => void;
};

export function NotificationDialogHeader({ color, toolId, label, inputRef, isReadOnly, onLabelChange }: Props) {
	const { t } = useI18n('workflow');
	const tool = toolId ? getNotificationTool(toolId) : null;
	return (
		<div className='notificationDialogHeader'>
			{tool ? <NotificationToolMark tool={tool} className='notificationToolMark' /> : (
				<span className='notificationToolMark notificationToolMark--empty'>
					<Icon name='bell' size={16} color='inherit' />
				</span>
			)}
			<div className='notificationDialogLabel'>
				<Input value={label} inputRef={inputRef} readOnly={isReadOnly} testId='notification-dialog-label'
					placeholder={t('notification.dialog.labelPlaceholder')}
					onChange={(event) => onLabelChange(event.target.value)} />
			</div>
			{color && (
				<span className='notificationIdChip' data-testid='notification-dialog-kind'>
					<span className='notificationIdChipDot' style={{ background: color }} />
					{t('notification.dialog.kind')}
				</span>
			)}
			<DocsLink page='guides/send-notifications' testId='notification-dialog-docs' />
		</div>
	);
}
