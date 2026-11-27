import type { ReactNode } from 'react'
import { Select } from 'antd'
import { Trans } from 'react-i18next'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { FormControl } from '@shared/ui/form/FormControl'
import { Radio } from '@shared/ui/primitives/Radio'
import { Typography } from '@shared/ui/primitives/Typography'
import { Hint } from '@shared/ui/primitives/Hint'
import { EntityText } from '@shared/ui/primitives/Text'
import { DocsLink } from '@shared/ui/actions/DocsLink'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { ConnectionMeta } from '@entities/connection/command/connectionCache'
import type { BusyPolicy } from '../../model/types'

const BUSY_POLICIES: BusyPolicy[] = ['QUEUE', 'REFUSE']

function ChoiceGroup<T extends string>({ name, values, labelKey, isReadOnly }: {
    name: string; values: T[]; labelKey: string; isReadOnly: boolean
}) {
    const { t } = useI18n('entities')
    const { field } = useController({ name })
    return (
        <FormControl label={`global-variable.mutable.${labelKey}.label`} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-testid={`global-variable-field-${name}`}>
                {values.map((value) => (
                    <div key={value}>
                        <Radio name={name} value={value} checked={field.value === value} disabled={isReadOnly}
                            onChange={() => field.onChange(value)} label={t(`global-variable.${labelKey}.${value}`)} />
                        <div style={{ paddingInlineStart: 24 }}>
                            <Typography variant="caption" isSubtle>{t(`global-variable.mutable.${labelKey}.hints.${value}`)}</Typography>
                        </div>
                    </div>
                ))}
            </div>
        </FormControl>
    )
}

function OwnerWorkflowsSelect({ isReadOnly }: { isReadOnly: boolean }) {
    const { t } = useI18n('entities')
    const { control, getFieldState, formState } = useFormContext()
    const { field } = useController({ name: 'ownerWorkflowIds', control })
    const error = getFieldState('ownerWorkflowIds', formState).error?.message
    const { data } = useFetchEntitiesQuery('/connection/all/meta')
    const options = ((data ?? []) as ConnectionMeta[]).map((workflow) => ({ value: workflow.id, label: workflow.title }))
    return (
        <FormControl label="global-variable.mutable.owner.label" hint="global-variable.mutable.owner.hint" error={error} style={{ width: '100%' }}>
            <Select
                mode="multiple"
                showSearch
                optionFilterProp="label"
                value={(field.value as number[] | undefined) ?? []}
                onChange={(value: number[]) => field.onChange(value)}
                options={options}
                disabled={isReadOnly}
                status={error ? 'error' : undefined}
                placeholder={t('global-variable.mutable.owner.placeholder')}
                style={{ width: '100%' }}
                data-testid="global-variable-field-owner-workflow"
            />
        </FormControl>
    )
}

// A new tab, so the unsaved variable form stays open.
function SystemConfigLink({ children }: { children?: ReactNode }) {
    return (
        <a href="/system-config" target="_blank" rel="noopener noreferrer" data-testid="global-variable-queue-limits-link">
            {children}
        </a>
    )
}

const QUEUE_LIMITS_COMPONENTS = { code: <code />, page: <SystemConfigLink /> }

// Plain text styled like a FormControl hint (e.g. the owner hint), not an info box.
function BusyPolicyScopeHint() {
    return (
        <div className="form-control__hint" data-testid="global-variable-busy-policy-scope-hint">
            <EntityText i18nKey="global-variable.mutable.busyPolicy.scope" />{' '}
            <DocsLink page="guides/global-variables" anchor="the-busy-policy-one-run-at-a-time" testId="global-variable-busy-policy-docs">
                <EntityText i18nKey="global-variable.docs.busyPolicy" />
            </DocsLink>
        </div>
    )
}

function QueueLimitsHint() {
    const busyPolicy = useWatch({ name: 'busyPolicy' }) as BusyPolicy | undefined
    if (busyPolicy !== 'QUEUE') return null
    return (
        <div data-testid="global-variable-queue-limits-hint">
            <Hint noPrefix>
                <Trans ns="entities" i18nKey="global-variable.mutable.busyPolicy.queueLimits" components={QUEUE_LIMITS_COMPONENTS} />
            </Hint>
        </div>
    )
}

export function MutableSettingsEditor({ mode }: { mode: Mode }) {
    const isReadOnly = mode === 'view'
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <OwnerWorkflowsSelect isReadOnly={isReadOnly} />
            <ChoiceGroup name="busyPolicy" values={BUSY_POLICIES} labelKey="busyPolicy" isReadOnly={isReadOnly} />
            <BusyPolicyScopeHint />
            <QueueLimitsHint />
        </div>
    )
}
