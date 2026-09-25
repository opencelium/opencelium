import { memo, useState } from 'react';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { StatusCell } from '@entities/schedule/ui/StatusCell';
import { ScheduleNextRun } from '../ScheduleNextRun/ScheduleNextRun';
import { ScheduleCardActions } from './ScheduleCardActions';
import { ScheduleCardDetails } from './ScheduleCardDetails';
import type { ScheduleCardProps } from './ScheduleCard.types';
import { useScheduleCardDelete } from './useScheduleCardDelete';

export const ScheduleCard = memo(function ScheduleCard({ item }: ScheduleCardProps) {
	const { schedule, recentlyUpdated } = item;
	const { t } = useI18n('workflow');
	const [expanded, setExpanded] = useState(false);
	const deletion = useScheduleCardDelete(schedule);
	return <div className={`wf-schedule-card ${recentlyUpdated ? 'wf-schedule-card--flash' : ''}`}>
		<div className='wf-schedule-card__head'>
			<Tooltip content={t(expanded ? 'schedules.collapse' : 'schedules.expand')}>
				<IconButton iconProps={{ name: expanded ? 'chevron-down' : 'chevron-right' }}
					type='text' size='xs' onClick={() => setExpanded((value) => !value)}
					testId={`workflow-schedule-toggle-${schedule.schedulerId}`} />
			</Tooltip>
			<div className='wf-schedule-card__status'>
				<StatusCell schedule={schedule} showCountdown={false} />
			</div>
			<ScheduleNextRun cronExp={schedule.cronExp} />
			<div className='wf-schedule-card__spacer' />
			<ScheduleCardActions schedule={schedule} deleting={deletion.deleting}
				onDelete={deletion.deleteSchedule} />
		</div>
		{expanded && <ScheduleCardDetails item={item} />}
	</div>;
});
