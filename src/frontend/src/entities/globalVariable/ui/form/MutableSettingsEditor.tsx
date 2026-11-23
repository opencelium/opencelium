import { Select } from 'antd'
import { useController, useFormContext } from 'react-hook-form'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { FormControl } from '@shared/ui/form/FormControl'
import { Radio } from '@shared/ui/primitives/Radio'
import { Typography } from '@shared/ui/primitives/Typography'
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

function OwnerWorkflowSelect({ isReadOnly }: { isReadOnly: boolean }) {
    const { t } = useI18n('entities')
    const { control, getFieldState, formState } = useFormContext()
    const { field } = useController({ name: 'ownerWorkflowId', control })
    const error = getFieldState('ownerWorkflowId', formState).error?.message
    const { data } = useFetchEntitiesQuery('/connection/all/meta')
    const options = ((data ?? []) as ConnectionMeta[]).map((workflow) => ({ value: workflow.id, label: workflow.title }))
    return (
        <FormControl label="global-variable.mutable.owner.label" hint="global-variable.mutable.owner.hint" error={error} style={{ width: '100%' }}>
            <Select
                showSearch
                optionFilterProp="label"
                value={field.value ?? undefined}
                onChange={(value: number) => field.onChange(value)}
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

export function MutableSettingsEditor({ mode }: { mode: Mode }) {
    const isReadOnly = mode === 'view'
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <OwnerWorkflowSelect isReadOnly={isReadOnly} />
            <ChoiceGroup name="busyPolicy" values={BUSY_POLICIES} labelKey="busyPolicy" isReadOnly={isReadOnly} />
        </div>
    )
}
