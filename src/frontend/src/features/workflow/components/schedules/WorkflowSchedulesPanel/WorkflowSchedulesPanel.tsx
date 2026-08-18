import { CloseOutlined } from '@ant-design/icons'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useDialog } from '@shared/ui/dialog/useDialog'
import { ScheduleCreateDialogContent } from '../ScheduleCreateDialogContent/ScheduleCreateDialogContent'
import { useWorkflowSchedules } from '../useWorkflowSchedules'
import { WorkflowSchedulesPanelBody } from './WorkflowSchedulesPanelBody'
import type { WorkflowSchedulesPanelProps } from './WorkflowSchedulesPanel.types'

export function WorkflowSchedulesPanel({ open, connectionId, connectionTitle,
    onClose }: WorkflowSchedulesPanelProps) {
    const { t } = useI18n('workflow')
    const dialog = useDialog()
    const { items, isLoading, count } = useWorkflowSchedules(connectionId)
    const openCreate = () => {
        if (!connectionId) return
        const id = dialog.open({ width: 720, top: 18, content:
            <ScheduleCreateDialogContent connectionId={connectionId}
                connectionTitle={connectionTitle} onSuccess={() => dialog.closeById(id)} /> })
    }

    return <>
        <div className={`drawerOverlay ${open ? 'drawerOverlayOpen' : ''}`} onClick={onClose} />
        <aside data-testid="workflow-schedules-panel"
            className={`rightDrawer wf-schedules-drawer ${open ? 'rightDrawerOpen' : ''}`}>
            <div className="drawerHeader">
                <div className="drawerTitle">{t('schedules.title')}
                    {connectionId && count > 0 ? ` (${count})` : ''}</div>
                <button className="iconButton" type="button" onClick={onClose}><CloseOutlined /></button>
            </div>
            {connectionId && <div className="wf-schedules-toolbar">
                <Button type="primary" iconLeft="plus" onClick={openCreate}
                    testId="workflow-schedules-add">{t('schedules.add')}</Button>
            </div>}
            <div className="drawerBody"><WorkflowSchedulesPanelBody
                hasConnection={Boolean(connectionId)} items={items}
                isLoading={isLoading} count={count} /></div>
        </aside>
    </>
}
