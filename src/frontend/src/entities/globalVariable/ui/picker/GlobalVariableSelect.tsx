import { useMemo } from 'react'
import { Select } from 'antd'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { GlobalVariableKind, PickerItem } from '../../model/types'
import { SECRET_MASK } from '../../model/display'
import { GlobalVariableKindBadge } from '../GlobalVariableKindBadge'
import { useGlobalVariablePicker } from './globalPicker'

// Scripts are left out until the field call editor exists: a script can't be referenced like a
// value, it must be called with its parameters.
const KIND_ORDER = ['CONSTANT', 'MUTABLE'] as const satisfies readonly GlobalVariableKind[]

type ValueItem = Extract<PickerItem, { kind: (typeof KIND_ORDER)[number] }>

const previewOf = (item: ValueItem) => (item.secret ? SECRET_MASK : item.valuePreview ?? '')

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
}

export function GlobalVariableSelect({ value, onChange, popupZIndex, disabled, className, testId, size, filter }: Props) {
    const { t } = useI18n('entities')
    const { items, isLoading } = useGlobalVariablePicker()

    const options = useMemo(() => KIND_ORDER
        .map((kind) => ({
            label: t(`global-variable.kind.${kind}.label`),
            options: items.filter((item): item is ValueItem => item.kind === kind && (!filter || filter(item))).map((item) => ({
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
        .filter((group) => group.options.length > 0), [filter, items, t])

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
