import { Popover } from 'antd';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { NotificationsAction } from '@entities/schedule/ui/NotificationsAction';
import { SupportLogsAction } from '@entities/schedule/ui/SupportLogsAction';
import type { ScheduleCardItem } from './ScheduleCard.types';

type Props = { schedule: ScheduleCardItem['schedule']; deleting: boolean;
	onDelete: () => void };

export function ScheduleCardActions({ schedule, deleting, onDelete }: Props) {
	const { t } = useI18n('workflow');
	return <Popover trigger={['hover', 'click']} placement='leftTop' arrow={false}
		overlayInnerStyle={{ padding: 4 }} content={<div style={{ display: 'flex',
			flexDirection: 'column', gap: 2 }}>
			<SupportLogsAction schedule={schedule} tooltipPlacement='left' />
			<NotificationsAction schedule={schedule} tooltipPlacement='left' />
			<Tooltip content={t('schedules.actions.delete')} placement='left'>
				<IconButton iconProps={{ name: 'delete', color: 'danger' }} size='xs'
					type='text' loading={deleting} onClick={onDelete} />
			</Tooltip>
		</div>}>
		<IconButton iconProps={{ name: 'more' }} type='text' size='xs'
			testId={`workflow-schedule-actions-${schedule.schedulerId}`} />
	</Popover>;
}
