import type { ReactNode } from 'react';
import { CronCell } from '@entities/schedule/ui/CronCell';
import { ExecutionCell } from '@entities/schedule/ui/ExecutionCell';
import { DurationCell } from '@entities/schedule/ui/DurationCell';
import { DebugModeCell } from '@entities/schedule/ui/DebugModeCell';
import { WebhookCell } from '@entities/schedule/ui/WebhookCell';
import { RunningExecBadge } from '@entities/schedule/ui/RunningExecBadge';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { ScheduleCardItem } from './ScheduleCard.types';

function Row({ label, children, fill }: { label: string; children: ReactNode; fill?: boolean }) {
	return <div className={`wf-schedule-row ${fill ? 'wf-schedule-row--fill' : ''}`}>
		<span className='wf-schedule-row__label'>{label}</span>
		<span className='wf-schedule-row__value'>{children}</span>
	</div>;
}

export function ScheduleCardDetails({ item }: { item: ScheduleCardItem }) {
	const { schedule, executions, avgDuration } = item;
	const { t } = useI18n('entities');
	const logs = (status: 's' | 'f') => ({ connectionId: schedule.connection.connectionId,
		schedulerId: schedule.schedulerId, status });
	return <div className='wf-schedule-card__details'>
		<Row label={t('schedule.list.columns.executions')} fill={executions.length > 0}>
			{executions.length ? <div className='wf-schedule-execs'>{executions.map((execution) =>
				<RunningExecBadge key={execution.execId}
					serverStartTime={execution.serverStartTime} avgDuration={execution.avgDuration} />)}
			</div> : <>-</>}
		</Row>
		<Row label={t('schedule.list.columns.cronExp')}>
			<CronCell schedule={schedule} tooltipPlacement='left' />
		</Row>
		<Row label={t('schedule.list.columns.lastSuccessExecution')}>
			<span className='wf-schedule-exec-cell'><ExecutionCell
				execution={schedule.lastExecution?.success} logs={logs('s')} /></span>
		</Row>
		<Row label={t('schedule.list.columns.lastFailExecution')}>
			<span className='wf-schedule-exec-cell'><ExecutionCell
				execution={schedule.lastExecution?.fail} logs={logs('f')} /></span>
		</Row>
		<Row label={t('schedule.list.columns.lastDuration')}><DurationCell duration={avgDuration} /></Row>
		<Row label={t('schedule.list.columns.debugMode')}><DebugModeCell schedule={schedule} /></Row>
		<Row label={t('schedule.list.columns.webhook')}><WebhookCell schedule={schedule}
			tooltipPlacement={schedule.webhook ? 'bottom' : 'left'} /></Row>
	</div>;
}
