import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@shared/ui/primitives/Card'
import { Typography } from '@shared/ui/primitives/Typography'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetGlobalVariableValuesQuery } from '../../api/globalVariableApi'
import type { GlobalVariable, GlobalVariableScope } from '../../model/types'
import { VALUES_POLL_MS } from '../live-values/liveValues'
import { BeingUpdatedBadge } from '../live-values/BeingUpdatedBadge'
import { SECRET_MASK } from '../../model/display'
import { ScriptSummary } from './ScriptSummary'

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <>
        <Typography variant="label" isSubtle>{label}</Typography>
        <div style={{ minWidth: 0 }}>{children}</div>
    </>
)

const ScopeText: React.FC<{ scope: GlobalVariableScope }> = ({ scope }) => {
    const { t } = useI18n('entities')
    const targets = scope.type === 'CATEGORIES' ? scope.categories : scope.type === 'WORKFLOWS' ? scope.workflows : []
    return (
        <span>
            {t(`global-variable.scope.${scope.type}`)}
            {targets.length > 0 && `: ${targets.map((target) => target.name).join(', ')}`}
        </span>
    )
}

export const GlobalVariableOverview: React.FC<{ variable: GlobalVariable }> = ({ variable }) => {
    const { t, lang } = useI18n('entities')
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
    const beingUpdatedBy = live ? live.beingUpdatedBy : variable.kind === 'MUTABLE' ? variable.beingUpdatedBy : null
    const isSecret = variable.kind === 'CONSTANT' && variable.secret

    const valueContent = (() => {
        if (variable.kind === 'SCRIPT') return <ScriptSummary script={variable.script} />
        if (isSecret) return <Typography variant="body">{variable.hasValue ? SECRET_MASK : t('global-variable.detail.noSecretValue')}</Typography>
        return (
            <pre data-testid="global-variable-detail-value"
                style={{ margin: 0, maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {JSON.stringify(live?.value ?? variable.value, null, 2)}
            </pre>
        )
    })()

    return (
        <Card bordered>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, max-content) 1fr', gap: '8px 16px' }}>
                <Row label={t(variable.kind === 'SCRIPT' ? 'global-variable.detail.script' : 'global-variable.detail.value')}>
                    {valueContent}
                    {beingUpdatedBy && <BeingUpdatedBadge beingUpdatedBy={beingUpdatedBy} />}
                </Row>
                <Row label={t('global-variable.fields.scope.label')}><ScopeText scope={variable.scope} /></Row>
                {variable.kind === 'MUTABLE' && (
                    <>
                        <Row label={t('global-variable.detail.ownerWorkflow')}>
                            {variable.ownerWorkflow
                                ? <Link to={`/workflow/update/${variable.ownerWorkflow.id}`}>{variable.ownerWorkflow.title}</Link>
                                : t('global-variable.detail.unclaimed')}
                        </Row>
                        <Row label={t('global-variable.detail.writePolicy')}>{t(`global-variable.writePolicy.${variable.writePolicy}`)}</Row>
                        <Row label={t('global-variable.detail.publishMode')}>{t(`global-variable.publishMode.${variable.publishMode}`)}</Row>
                    </>
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
        </Card>
    )
}
