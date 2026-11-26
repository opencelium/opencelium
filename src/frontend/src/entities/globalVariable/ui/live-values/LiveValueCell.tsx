import React from 'react'
import { Typography } from '@shared/ui/primitives/Typography'
import { TruncatedTextCell } from '@shared/table/TruncatedTextCell'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { GlobalVariableListItem } from '../../model/types'
import { previewValue, SECRET_MASK } from '../../model/display'
import { useLiveGlobalValue } from './liveValues'
import { BeingUpdatedBadges } from './BeingUpdatedBadge'

type Props = {
    row: GlobalVariableListItem
}

export const LiveValueCell: React.FC<Props> = ({ row }) => {
    const { t } = useI18n('entities')
    const isScript = row.kind === 'SCRIPT'
    const live = useLiveGlobalValue(isScript ? null : row.id)

    if (isScript) {
        return (
            <Typography variant="caption" isSubtle>
                {t('global-variable.list.scriptSummary', { language: row.language, count: row.parameterCount ?? 0 })}
            </Typography>
        )
    }
    if (row.secret) return <Typography variant="body" isSubtle>{SECRET_MASK}</Typography>

    const preview = live ? previewValue(live.value) : row.valuePreview
    const beingUpdatedBy = (live ? live.beingUpdatedBy : row.beingUpdatedBy) ?? []
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            <TruncatedTextCell value={preview ?? ''} breakAnywhere />
            <BeingUpdatedBadges runs={beingUpdatedBy} />
        </div>
    )
}
