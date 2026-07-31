import { CloseOutlined } from '@ant-design/icons'
import { Button } from '@shared/ui/primitives/Button'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { Empty } from '@shared/ui/primitives/Empty'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDialog } from '@shared/ui/dialog/useDialog'
import { ScheduleCard } from './ScheduleCard'
import { ScheduleCreateDialogContent } from './ScheduleCreateDialogContent'
import { useWorkflowSchedules } from './useWorkflowSchedules'

type Props = {
    open: boolean
    connectionId?: string
    connectionTitle: string
    onClose: () => void
}

export function WorkflowSchedulesPanel({ open, connectionId, connectionTitle, onClose }: Props) {
    const { t } = useI18n('workflow')
    const dialog = useDialog()
    const { items, isLoading, count } = useWorkflowSchedules(connectionId)

    const openCreate = () => {
        if (!connectionId) return
        const id = dialog.open({
            width: 720,
            top: 18,
            content: (
                <ScheduleCreateDialogContent
                    connectionId={connectionId}
                    connectionTitle={connectionTitle}
                    onSuccess={() => dialog.closeById(id)}
                />
            ),
        })
    }

    const renderBody = () => {
        if (!connectionId) {
            return <Empty className="wf-schedule-empty" description={t('schedules.saveFirst')} />
        }
        if (isLoading) {
            return (
                <div className="wf-schedule-loading">
                    <Loading />
                </div>
            )
        }
        if (count === 0) {
            return <Empty className="wf-schedule-empty" description={t('schedules.empty')} />
        }
        return (
            <div className="wf-schedule-list">
                {items.map((item) => (
                    <ScheduleCard key={item.schedule.schedulerId} item={item} />
                ))}
            </div>
        )
    }

    return (
        <>
            <div
                className={`drawerOverlay ${open ? 'drawerOverlayOpen' : ''}`}
                onClick={onClose}
            />
            <aside
                data-testid="workflow-schedules-panel"
                className={`rightDrawer wf-schedules-drawer ${open ? 'rightDrawerOpen' : ''}`}
            >
                <div className="drawerHeader">
                    <div className="drawerTitle">
                        {t('schedules.title')}
                        {connectionId && count > 0 ? ` (${count})` : ''}
                    </div>
                    <button className="iconButton" type="button" onClick={onClose}>
                        <CloseOutlined />
                    </button>
                </div>
                {connectionId && (
                    <div className="wf-schedules-toolbar">
                        <Button
                            type="primary"
                            iconLeft="plus"
                            onClick={openCreate}
                            testId="workflow-schedules-add"
                        >
                            {t('schedules.add')}
                        </Button>
                    </div>
                )}
                <div className="drawerBody">{renderBody()}</div>
            </aside>
        </>
    )
}
