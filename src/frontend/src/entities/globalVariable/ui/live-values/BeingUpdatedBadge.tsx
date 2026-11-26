import React from 'react'
import { Tag } from 'antd'
import { Link } from 'react-router-dom'
import { Icon } from '@shared/ui/primitives/Icon'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { BeingUpdatedBy } from '../../model/types'

type Props = {
    beingUpdatedBy: BeingUpdatedBy
}

export const BeingUpdatedBadge: React.FC<Props> = ({ beingUpdatedBy }) => {
    const { t, lang } = useI18n('entities')
    const startedAt = new Date(beingUpdatedBy.startedAt).toLocaleString(lang)
    return (
        <Tooltip content={t('global-variable.live.beingUpdatedHint', { startedAt })} placement="top">
            <Tag color="processing" icon={<Icon name="refresh" size={12} />} data-testid="global-variable-being-updated">
                <Link to={`/workflow/update/${beingUpdatedBy.workflowId}`} data-row-click-ignore>
                    {beingUpdatedBy.executionId === null
                        ? t('global-variable.live.beingUpdatedStarting')
                        : t('global-variable.live.beingUpdated', { executionId: beingUpdatedBy.executionId })}
                </Link>
            </Tag>
        </Tooltip>
    )
}

// Runs of different owner workflows may write the variable at the same time, one badge each.
export const BeingUpdatedBadges: React.FC<{ runs: BeingUpdatedBy[] }> = ({ runs }) => {
    if (runs.length === 0) return null
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {runs.map((run) => <BeingUpdatedBadge key={run.workflowId} beingUpdatedBy={run} />)}
        </div>
    )
}
