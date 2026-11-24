import React from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetGlobalVariableValuesQuery } from '../../api/globalVariableApi'
import type { ActorRef, GlobalVariable } from '../../model/types'
import { VALUES_POLL_MS } from '../live-values/liveValues'
import { SECRET_MASK } from '../../model/display'
import { MutableValueRows } from './MutableValueRows'
import { OverviewRow } from './OverviewRow'

/** What the read-only wizard can't show: the live value of a mutable variable, whether a secret is set, and the bookkeeping fields. */
export const GlobalVariableOverview: React.FC<{ variable: GlobalVariable }> = ({ variable }) => {
    const { t, lang } = useI18n('entities')
    const hasValue = variable.kind !== 'SCRIPT'
    const { data: values, refetch } = useGetGlobalVariableValuesQuery([variable.id], {
        skip: !hasValue,
        pollingInterval: VALUES_POLL_MS,
        skipPollingIfUnfocused: true,
    })
    const live = values?.[0]
    const isSecret = variable.kind === 'CONSTANT' && variable.secret
    // `updatedAt` / `updatedBy` are the last change a user saved; a run's writes don't move them.
    const madeBy = (time: string | null, actor: ActorRef | null) => (time
        ? t('global-variable.detail.updatedBy', { time: new Date(time).toLocaleString(lang), name: actor?.name ?? '—' })
        : '—')

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, max-content) 1fr', columnGap: 24, rowGap: 12, alignItems: 'baseline' }}>
            {variable.kind === 'MUTABLE' && <MutableValueRows variable={variable} live={live} onReset={() => void refetch()} />}
            {isSecret && (
                <OverviewRow label={t('global-variable.detail.value')}>
                    {variable.hasValue ? SECRET_MASK : t('global-variable.detail.noSecretValue')}
                </OverviewRow>
            )}
            <OverviewRow label={t('global-variable.detail.ownerUser')}>{variable.ownerUser?.name ?? '—'}</OverviewRow>
            <OverviewRow label={t('global-variable.detail.version')}>{variable.version}</OverviewRow>
            <OverviewRow label={t('global-variable.detail.updated')}>{madeBy(variable.updatedAt, variable.updatedBy)}</OverviewRow>
            <OverviewRow label={t('global-variable.detail.created')}>{madeBy(variable.createdAt, variable.createdBy)}</OverviewRow>
        </div>
    )
}
