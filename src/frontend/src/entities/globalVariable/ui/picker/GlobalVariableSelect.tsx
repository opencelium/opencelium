import { useMemo } from 'react'
import { Select } from 'antd'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { GlobalVariableKind, PickerItem } from '../../model/types'
import { SECRET_MASK } from '../../model/display'
import { GlobalVariableKindBadge } from '../GlobalVariableKindBadge'
import { useGlobalVariablePicker } from './globalPicker'

const VALUE_KINDS = ['CONSTANT', 'MUTABLE'] as const satisfies readonly GlobalVariableKind[]
const ALL_KINDS = [...VALUE_KINDS, 'SCRIPT'] as const satisfies readonly GlobalVariableKind[]

const previewOf = (item: PickerItem) => {
    switch (item.kind) {
        case 'CONSTANT':
        case 'MUTABLE':
            return item.secret ? SECRET_MASK : item.valuePreview ?? ''
        case 'SCRIPT':
            return `(${item.parameters.map((parameter) => parameter.name).join(', ')})`
        default: {
            const _exhaustive: never = item
            return _exhaustive
        }
    }
}

type Props = {
    value?: string
    onChange: (name: string) => void
    popupZIndex?: number
    disabled?: boolean
    className?: string
    testId?: string
    size?: 'middle' | 'large'
    /** Narrows the offered variables, e.g. to the mutable ones a Set step may write. */
    filter?: (item: PickerItem) => boolean
    /**
     * Also offers script variables. Only where the reference becomes an enhancement arg, which a
     * run binds as a function: a script can't stand in a text field such as the URL or a condition.
     */
    canPickScripts?: boolean
}

export function GlobalVariableSelect({ value, onChange, popupZIndex, disabled, className, testId, size, filter,
    canPickScripts = false }: Props) {
    const { t } = useI18n('entities')
    const { items, isLoading } = useGlobalVariablePicker()

    const options = useMemo(() => (canPickScripts ? ALL_KINDS : VALUE_KINDS)
        .map((kind) => ({
            label: t(`global-variable.kind.${kind}.label`),
            options: items.filter((item) => item.kind === kind && (!filter || filter(item))).map((item) => ({
                value: item.name,
                searchText: `${item.name} ${item.description}`,
                label: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }} title={item.description}>
                        <GlobalVariableKindBadge kind={item.kind} isIconOnly />
                        <code>{item.name}</code>
                        <span style={{ opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {previewOf(item)}
                        </span>
                    </span>
                ),
            })),
        }))
        .filter((group) => group.options.length > 0), [canPickScripts, filter, items, t])

    return (
        <Select
            value={value}
            onChange={onChange}
            options={options}
            loading={isLoading}
            disabled={disabled}
            showSearch
            optionFilterProp="searchText"
            placeholder={t('global-variable.picker.placeholder')}
            notFoundContent={isLoading ? null : t('global-variable.picker.empty')}
            className={className}
            size={size}
            style={{ minWidth: 220 }}
            popupMatchSelectWidth={false}
            getPopupContainer={() => document.body}
            styles={{ popup: { root: { zIndex: popupZIndex ?? 13010 } } }}
            data-testid={testId ?? 'global-variable-picker'}
        />
    )
}
