import { memo, useState, type ReactNode } from 'react'
import { message, Popover } from 'antd'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext'
import { useGeneralRequestMutation } from '@shared/api/genericApi'
import { StatusCell } from '@entities/schedule/ui/StatusCell'
import { CronCell } from '@entities/schedule/ui/CronCell'
import { ExecutionCell } from '@entities/schedule/ui/ExecutionCell'
import { DurationCell } from '@entities/schedule/ui/DurationCell'
import { DebugModeCell } from '@entities/schedule/ui/DebugModeCell'
import { WebhookCell } from '@entities/schedule/ui/WebhookCell'
import { RunningExecBadge } from '@entities/schedule/ui/RunningExecBadge'
import { NotificationsAction } from '@entities/schedule/ui/NotificationsAction'
import { SupportLogsAction } from '@entities/schedule/ui/SupportLogsAction'
import { ScheduleNextRun } from './ScheduleNextRun'
import type { WorkflowScheduleItem } from './useWorkflowSchedules'

type Props = {
    item: WorkflowScheduleItem
}

function Row({ label, children, fill }: { label: string; children: ReactNode; fill?: boolean }) {
    return (
        <div className={`wf-schedule-row ${fill ? 'wf-schedule-row--fill' : ''}`}>
            <span className="wf-schedule-row__label">{label}</span>
            <span className="wf-schedule-row__value">{children}</span>
        </div>
    )
}

export const ScheduleCard = memo(function ScheduleCard({ item }: Props) {
    const { schedule, executions, avgDuration, recentlyUpdated } = item
    const { t } = useI18n('workflow')
    const { t: tEntities } = useI18n('entities')
    const confirm = useConfirm()
    const [generalRequest] = useGeneralRequestMutation()
    const [deleting, setDeleting] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const connectionId = schedule.connection.connectionId

    const handleDelete = async () => {
        const ok = await confirm({
            title: t('schedules.delete.title'),
            message: t('schedules.delete.message', { title: schedule.title }),
            confirmVariant: 'danger',
            onConfirm: async () => {
                setDeleting(true)
                try {
                    await generalRequest({
                        url: `/scheduler/${schedule.schedulerId}`,
                        method: 'DELETE',
                        options: {},
                    }).unwrap()
                } finally {
                    setDeleting(false)
                }
            },
        })
        if (!ok) return
        message.success(t('schedules.delete.success', { title: schedule.title }))
    }

    return (
        <div className={`wf-schedule-card ${recentlyUpdated ? 'wf-schedule-card--flash' : ''}`}>
            <div className="wf-schedule-card__head">
                <Tooltip content={expanded ? t('schedules.collapse') : t('schedules.expand')}>
                    <IconButton
                        iconProps={{ name: expanded ? 'chevron-down' : 'chevron-right' }}
                        type="text"
                        size="xs"
                        onClick={() => setExpanded((prev) => !prev)}
                        testId={`workflow-schedule-toggle-${schedule.schedulerId}`}
                    />
                </Tooltip>
                <div className="wf-schedule-card__status">
                    <StatusCell schedule={schedule} showCountdown={false} />
                </div>
                <ScheduleNextRun cronExp={schedule.cronExp} />
                <div className="wf-schedule-card__spacer" />
                <Popover
                    trigger={['hover', 'click']}
                    placement="leftTop"
                    arrow={false}
                    overlayInnerStyle={{ padding: 4 }}
                    content={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <SupportLogsAction schedule={schedule} tooltipPlacement="left" />
                            <NotificationsAction schedule={schedule} tooltipPlacement="left" />
                            <Tooltip content={t('schedules.actions.delete')} placement="left">
                                <IconButton
                                    iconProps={{ name: 'delete', color: 'danger' }}
                                    size="xs"
                                    type="text"
                                    loading={deleting}
                                    onClick={handleDelete}
                                />
                            </Tooltip>
                        </div>
                    }
                >
                    <IconButton
                        iconProps={{ name: 'more' }}
                        type="text"
                        size="xs"
                        testId={`workflow-schedule-actions-${schedule.schedulerId}`}
                    />
                </Popover>
            </div>

            {expanded && (
                <div className="wf-schedule-card__details">
                    <Row label={tEntities('schedule.list.columns.executions')} fill>
                        {executions.length === 0 ? (
                            <span className="wf-schedule-exec-empty">—</span>
                        ) : (
                            <div className="wf-schedule-execs">
                                {executions.map((execution) => (
                                    <RunningExecBadge
                                        key={execution.execId}
                                        localStartTime={execution.localStartTime}
                                        serverStartTime={execution.serverStartTime}
                                        avgDuration={execution.avgDuration}
                                    />
                                ))}
                            </div>
                        )}
                    </Row>
                    <Row label={tEntities('schedule.list.columns.cronExp')}>
                        <CronCell schedule={schedule} tooltipPlacement="left" />
                    </Row>
                    <Row label={tEntities('schedule.list.columns.lastSuccessExecution')}>
                        <span className="wf-schedule-exec-cell">
                            <ExecutionCell
                                execution={schedule.lastExecution?.success}
                                logs={{ connectionId, schedulerId: schedule.schedulerId, status: 's' }}
                            />
                        </span>
                    </Row>
                    <Row label={tEntities('schedule.list.columns.lastFailExecution')}>
                        <span className="wf-schedule-exec-cell">
                            <ExecutionCell
                                execution={schedule.lastExecution?.fail}
                                logs={{ connectionId, schedulerId: schedule.schedulerId, status: 'f' }}
                            />
                        </span>
                    </Row>
                    <Row label={tEntities('schedule.list.columns.lastDuration')}>
                        <DurationCell duration={avgDuration} />
                    </Row>
                    <Row label={tEntities('schedule.list.columns.debugMode')}>
                        <DebugModeCell schedule={schedule} />
                    </Row>
                    <Row label={tEntities('schedule.list.columns.webhook')}>
                        {/* generate (no webhook) reads better on the left; copy/remove
                            (webhook present) on the bottom so they don't crowd each other. */}
                        <WebhookCell
                            schedule={schedule}
                            tooltipPlacement={schedule.webhook ? 'bottom' : 'left'}
                        />
                    </Row>
                </div>
            )}
        </div>
    )
})
