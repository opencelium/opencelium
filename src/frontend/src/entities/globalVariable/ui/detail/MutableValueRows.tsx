import React from 'react'
import { Button } from '@shared/ui/primitives/Button'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { GlobalVariableValue, MutableVariable } from '../../model/types'
import { BeingUpdatedBadge } from '../live-values/BeingUpdatedBadge'
import { OverviewRow } from './OverviewRow'
import { useResetVariable } from './useResetVariable'

type Props = {
    variable: MutableVariable
    live: GlobalVariableValue | undefined
    onReset: () => void
}

/** The current value runs read and write, who set it, and the initial value a reset goes back to. */
export const MutableValueRows: React.FC<Props> = ({ variable, live, onReset }) => {
    const { t, lang } = useI18n('entities')
    const { reset, isResetting } = useResetVariable(variable, onReset)
    const setAt = live ? live.updatedAt : variable.mutable.setAt
    const setBy = live ? live.updatedBy : variable.mutable.setBy
    const beingUpdatedBy = live?.beingUpdatedBy ?? null
    const canReset = variable.myPermissions.includes('EDIT')

    return (
        <>
            <OverviewRow label={t('global-variable.detail.value')}>
                <pre data-testid="global-variable-detail-value"
                    style={{ margin: 0, maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'inherit' }}>
                    {JSON.stringify(live?.value ?? variable.mutable.currentValue, null, 2)}
                </pre>
                {setAt && (
                    <Typography variant="caption" isSubtle>
                        {t(setBy ? 'global-variable.detail.setBy' : 'global-variable.detail.setByRun', {
                            time: new Date(setAt).toLocaleString(lang), name: setBy?.name ?? '',
                        })}
                    </Typography>
                )}
                {beingUpdatedBy && <BeingUpdatedBadge beingUpdatedBy={beingUpdatedBy} />}
            </OverviewRow>
            <OverviewRow label={t('global-variable.detail.initialValue')}>
                <span style={{ overflowWrap: 'anywhere' }}>{JSON.stringify(variable.value)}</span>
                {canReset && (
                    <div style={{ marginTop: 6 }}>
                        <Button onClick={() => void reset()} loading={isResetting} iconLeft="refresh" testId="global-variable-reset">
                            {t('global-variable.reset.action')}
                        </Button>
                    </div>
                )}
            </OverviewRow>
            <OverviewRow label={t('global-variable.mutable.owner.label')}>{variable.mutable.ownerWorkflow?.title ?? '—'}</OverviewRow>
            <OverviewRow label={t('global-variable.mutable.busyPolicy.label')}>{t(`global-variable.busyPolicy.${variable.mutable.busyPolicy}`)}</OverviewRow>
        </>
    )
}
