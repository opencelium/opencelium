import React, { useState } from 'react'
import AceEditor from 'react-ace'
import 'ace-builds/src-noconflict/mode-json'
import 'ace-builds/src-noconflict/theme-tomorrow'
import 'ace-builds/src-noconflict/theme-tomorrow_night'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { Radio } from 'antd'
import { FieldArrayEditor } from '@shared/ui/wizard-step/editor/general/FieldArrayEditor'
import { FormInput } from '@shared/ui/form/FormInput'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tabs } from '@shared/ui/primitives/Tabs'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useTheme } from '@shared/theme/hooks/useTheme'
import type { Mode } from '@/engine/entity/EntityDefinition'
import { FormControl } from '@shared/ui/form/FormControl'
import { FormSwitch } from '@shared/ui/form/FormSwitch'

interface InvokerOperationsEditorProps {
    name: string
    label?: string
    mode?: Mode
}

type RadioOption = { label: string; value: string }

const METHOD_OPTIONS: RadioOption[] = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
]

const METHOD_COLORS: Record<string, string> = {
    GET: 'var(--color-action-primary)',
    POST: 'var(--color-status-success-fg)',
    PUT: 'var(--color-status-warning-fg)',
    DELETE: 'var(--color-status-error-fg)',
}

const DATA_OPTIONS: RadioOption[] = [
    { label: 'raw', value: 'raw' },
    { label: 'graphql', value: 'graphql' },
]

const FORMAT_OPTIONS: RadioOption[] = [
    { label: 'json', value: 'json' },
    { label: 'xml', value: 'xml' },
]

const TYPE_OPTIONS: RadioOption[] = [
    { label: 'object', value: 'object' },
    { label: 'array', value: 'array' },
]

const DEFAULT_OPERATION = {
    name: '',
    endpoint: '',
    method: 'GET',
    testConnection: false,
    request: {
        headersJson: '{}',
        data: 'raw',
        format: 'json',
        type: 'object',
        bodyJson: '{}',
    },
    response: {
        success: {
            status: '',
            headersJson: '{}',
            data: 'raw',
            format: 'json',
            type: 'object',
            bodyJson: '{}',
        },
        fail: {
            status: '',
            headersJson: '{}',
            data: 'raw',
            format: 'json',
            type: 'object',
            bodyJson: '{}',
        },
    },
}

function RadioGroupField({
    name,
    label,
    options,
    readOnly,
}: {
    name: string
    label: string
    options: RadioOption[]
    readOnly: boolean
}) {
    const { control } = useFormContext()
    const { field } = useController({ name, control })
    return (
        <FormControl label={label} name={name}>
            <Radio.Group
                value={field.value}
                onChange={(e) => !readOnly && field.onChange(e.target.value)}
                disabled={readOnly}
                options={options}
                optionType="button"
                buttonStyle="solid"
                size="small"
            />
        </FormControl>
    )
}

function JsonEditorField({
    name,
    label,
    readOnly,
    height = '120px',
}: {
    name: string
    label: string
    readOnly: boolean
    height?: string
}) {
    const { control } = useFormContext()
    const { field } = useController({ name, control })
    const [localError, setLocalError] = useState<string | undefined>()
    const { themeMode } = useTheme()
    const aceTheme = themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'

    const value = typeof field.value === 'string' ? field.value : '{}'

    const handleChange = (val: string) => {
        try {
            JSON.parse(val)
            setLocalError(undefined)
        } catch {
            setLocalError('Invalid JSON')
        }
        field.onChange(val)
    }

    return (
        <FormControl label={label} name={name} error={localError}>
            <div style={{ border: '1px solid var(--color-border-default)', borderRadius: 4, overflow: 'hidden', width: '100%' }}>
                <AceEditor
                    mode="json"
                    theme={aceTheme}
                    name={`ace_${name.replace(/\./g, '_')}`}
                    value={value}
                    onChange={readOnly ? undefined : handleChange}
                    readOnly={readOnly}
                    width="100%"
                    height={height}
                    fontSize={12}
                    setOptions={{ useWorker: false, showPrintMargin: false, tabSize: 2 }}
                />
            </div>
        </FormControl>
    )
}

function OperationSection({
    prefix,
    withStatus,
    readOnly,
}: {
    prefix: string
    withStatus: boolean
    readOnly: boolean
}) {
    const { t } = useI18n('entities')
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, width: '100%' }}>
            {withStatus && (
                <FormInput
                    name={`${prefix}.status`}
                    label={t('invoker.fields.operations.item.status', { defaultValue: 'Status' })}
                    readOnly={readOnly}
                />
            )}
            <JsonEditorField
                name={`${prefix}.headersJson`}
                label={t('invoker.fields.operations.item.headers', { defaultValue: 'Headers' })}
                readOnly={readOnly}
            />
            <div style={{display: 'flex', gap: 20}}>
                <RadioGroupField
                    name={`${prefix}.data`}
                    label={t('invoker.fields.operations.item.data', { defaultValue: 'Data' })}
                    options={DATA_OPTIONS}
                    readOnly={readOnly}
                />
                <RadioGroupField
                    name={`${prefix}.format`}
                    label={t('invoker.fields.operations.item.format', { defaultValue: 'Format' })}
                    options={FORMAT_OPTIONS}
                    readOnly={readOnly}
                />
                <RadioGroupField
                    name={`${prefix}.type`}
                    label={t('invoker.fields.operations.item.type', { defaultValue: 'Type' })}
                    options={TYPE_OPTIONS}
                    readOnly={readOnly}
                />
            </div>
            <JsonEditorField
                name={`${prefix}.bodyJson`}
                label={t('invoker.fields.operations.item.body', { defaultValue: 'Body' })}
                readOnly={readOnly}
                height="160px"
            />
        </div>
    )
}

function OperationItemHeader({
    index,
    remove,
    readOnly,
}: {
    index: number
    remove: (i: number) => void
    readOnly: boolean
}) {
    const { control } = useFormContext()
    const prefix = `operations.${index}`
    const name = useWatch({ name: `${prefix}.name`, control }) as string
    const endpoint = useWatch({ name: `${prefix}.endpoint`, control }) as string
    const method = useWatch({ name: `${prefix}.method`, control }) as string
    const testConnection = useWatch({ name: `${prefix}.testConnection`, control }) as boolean

    const hasError = !name?.trim() || !endpoint?.trim()

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '2px 0',
                minWidth: 0,
            }}
            title={hasError ? "Name and endpoint are required" : undefined}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                {testConnection && (
                    <span style={{ color: 'var(--color-status-warning-fg)', fontSize: 14, flexShrink: 0 }}>★</span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 500 }}>
                    {name || '(unnamed)'}
                </span>
            </div>
            <div style={{marginRight: 10}}>
                {hasError && (
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'var(--color-status-error-fg)',
                            flexShrink: 0,
                            display: 'inline-block',
                        }}
                    />
                )}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span
                    style={{
                        background: METHOD_COLORS[method] ?? 'var(--color-text-secondary)',
                        color: 'var(--color-text-on-action)',
                        borderRadius: 4,
                        padding: '2px 7px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        lineHeight: '18px',
                    }}
                >
                    {method || 'GET'}
                </span>
                {!readOnly && (
                    <IconButton
                        size="sm"
                        type="text"
                        iconProps={{ name: 'delete' }}
                        onClick={(e) => {
                            e.stopPropagation()
                            remove(index)
                        }}
                    />
                )}
            </div>
        </div>
    )
}

const OperationItem = React.memo(function OperationItem({
    index,
    remove,
    readOnly,
    hideDeleteButton = false,
}: {
    index: number
    remove: (i: number) => void
    readOnly: boolean
    hideDeleteButton?: boolean
}) {
    const { t } = useI18n('entities')
    const { control } = useFormContext()
    const prefix = `operations.${index}`

    const allOperations = useWatch({ name: 'operations', control }) as any[] | undefined
    const testConnection = Boolean(allOperations?.[index]?.testConnection)
    const hasAnyTestConnection = (allOperations ?? []).some((op: any) => op?.testConnection === true)

    const tabs = [
        {
            key: 'request',
            label: t('invoker.fields.operations.item.request', { defaultValue: 'Request' }),
            content: (
                <OperationSection prefix={`${prefix}.request`} withStatus={false} readOnly={readOnly} />
            ),
        },
        {
            key: 'success',
            label: t('invoker.fields.operations.item.responseSuccess', { defaultValue: 'Response (Success)' }),
            content: (
                <OperationSection prefix={`${prefix}.response.success`} withStatus={true} readOnly={readOnly} />
            ),
        },
        {
            key: 'fail',
            label: t('invoker.fields.operations.item.responseFail', { defaultValue: 'Response (Fail)' }),
            content: (
                <OperationSection prefix={`${prefix}.response.fail`} withStatus={true} readOnly={readOnly} />
            ),
        },
    ]

    const showTestConnectionSwitch = !hasAnyTestConnection || testConnection

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>

            {showTestConnectionSwitch && (
                <FormSwitch
                    name={`${prefix}.testConnection`}
                    label={t('invoker.fields.operations.item.testConnection', { defaultValue: 'Test Connection' })}
                    disabled={readOnly}
                    readOnly={readOnly}
                />
            )}
            <FormInput
                name={`${prefix}.name`}
                label={t('invoker.fields.operations.item.name', { defaultValue: 'Name' })}
                readOnly={readOnly}
                rules={readOnly ? undefined : {
                    required: t('invoker.fields.operations.errors.nameRequired', { defaultValue: 'Name is required' }),
                }}
            />
            <FormInput
                name={`${prefix}.endpoint`}
                label={t('invoker.fields.operations.item.endpoint', { defaultValue: 'Endpoint' })}
                readOnly={readOnly}
                rules={readOnly ? undefined : {
                    required: t('invoker.fields.operations.errors.endpointRequired', { defaultValue: 'Endpoint is required' }),
                }}
            />
            {!readOnly && !hideDeleteButton && (
                <div style={{ position: 'absolute', top: 10, right: 0 }}>
                    <IconButton
                        size="sm"
                        type="text"
                        iconProps={{ name: 'delete' }}
                        onClick={() => remove(index)}
                    />
                </div>
            )}

            <RadioGroupField
                name={`${prefix}.method`}
                label={t('invoker.fields.operations.item.method', { defaultValue: 'Method' })}
                options={METHOD_OPTIONS}
                readOnly={readOnly}
            />

            <Tabs items={tabs} />
        </div>
    )
})

export function InvokerOperationsEditor({ name, label, mode }: InvokerOperationsEditorProps) {
    const { t } = useI18n('entities')
    const { control, formState: { errors } } = useFormContext()

    const emptyError = (
        (errors as any)[name]?.root?.message ?? (errors as any)[name]?.message
    ) as string | undefined

    const readOnly = mode === 'view'
    const translatedLabel = label ? t(label, { defaultValue: label }) : undefined

    return (
        <FieldArrayEditor
            name={name}
            label={translatedLabel}
            required={!readOnly}
            error={emptyError}
            defaultItem={DEFAULT_OPERATION}
            variant="default"
            collapsible
            defaultCollapsed
            hideAddButton={readOnly}
            addButtonText={t('invoker.fields.operations.add', { defaultValue: 'Add Operation' })}
            emptyText={t('invoker.fields.operations.empty', { defaultValue: 'No operations defined.' })}
            rules={{
                validate: (value: unknown[]) =>
                    value.length > 0 ||
                    t('invoker.fields.operations.errors.required', {
                        defaultValue: 'At least one operation must be defined',
                    }),
            }}
            renderHeader={({ index, remove }) => (
                <OperationItemHeader
                    index={index}
                    remove={remove}
                    readOnly={readOnly}
                />
            )}
            renderItem={({ index, remove }) => (
                <OperationItem
                    index={index}
                    remove={remove}
                    readOnly={readOnly}
                    hideDeleteButton
                />
            )}
        />
    )
}
