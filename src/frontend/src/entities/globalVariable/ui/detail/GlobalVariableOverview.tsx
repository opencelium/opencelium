import React from 'react'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetGlobalVariableValuesQuery } from '../../api/globalVariableApi'
import type { GlobalVariable } from '../../model/types'
import { VALUES_POLL_MS } from '../live-values/liveValues'
import { BeingUpdatedBadge } from '../live-values/BeingUpdatedBadge'
import { SECRET_MASK } from '../../model/display'

// Same label/value layout as the subscription page's license information.
const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <>
        <Typography isBold>{label}:</Typography>
        <div style={{ minWidth: 0, textAlign: 'right' }}><Typography as="div">{children}</Typography></div>
    </>
)

/** What the read-only wizard can't show: the live value of a mutable variable, whether a secret is set, and the bookkeeping fields. */
export const GlobalVariableOverview: React.FC<{ variable: GlobalVariable }> = ({ variable }) => {
    const { t, lang } = useI18n('entities')
    const isMutable = variable.kind === 'MUTABLE'
    const hasValue = variable.kind !== 'SCRIPT'
    const { data: values } = useGetGlobalVariableValuesQuery([variable.id], {
        skip: !hasValue,
        pollingInterval: VALUES_POLL_MS,
        skipPollingIfUnfocused: true,
    })
    const live = values?.[0]
    const formatTime = (iso: string) => new Date(iso).toLocaleString(lang)
    const updatedAt = live?.updatedAt ?? variable.updatedAt
    const updatedBy = live?.updatedBy ?? variable.updatedBy
    const beingUpdatedBy = live ? live.beingUpdatedBy : isMutable ? variable.beingUpdatedBy : null
    const isSecret = variable.kind === 'CONSTANT' && variable.secret

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, max-content) 1fr', columnGap: 24, rowGap: 12, alignItems: 'baseline' }}>
            {isMutable && (
                <Row label={t('global-variable.detail.value')}>
                    <pre data-testid="global-variable-detail-value"
                        style={{ margin: 0, maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'inherit' }}>
                        {JSON.stringify(live?.value ?? variable.value, null, 2)}
                    </pre>
                    {beingUpdatedBy && <BeingUpdatedBadge beingUpdatedBy={beingUpdatedBy} />}
                </Row>
            )}
            {isSecret && (
                <Row label={t('global-variable.detail.value')}>
                    {variable.hasValue ? SECRET_MASK : t('global-variable.detail.noSecretValue')}
                </Row>
            )}
            <Row label={t('global-variable.detail.ownerUser')}>{variable.ownerUser.name}</Row>
            <Row label={t('global-variable.detail.version')}>{live?.version ?? variable.version}</Row>
            <Row label={t('global-variable.detail.updated')}>
                {t('global-variable.detail.updatedBy', { time: formatTime(updatedAt), name: updatedBy.name })}
            </Row>
            <Row label={t('global-variable.detail.created')}>
                {t('global-variable.detail.updatedBy', { time: formatTime(variable.createdAt), name: variable.createdBy.name })}
            </Row>
        </div>
    )
}
