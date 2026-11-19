import { useMemo } from 'react'
import { Select } from 'antd'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { GlobalVariableKind, PickerItem } from '../../model/types'
import { SECRET_MASK } from '../../model/display'
import { GlobalVariableKindBadge } from '../GlobalVariableKindBadge'
import { useGlobalVariablePicker } from './globalPicker'

const KIND_ORDER: GlobalVariableKind[] = ['CONSTANT', 'MUTABLE', 'SCRIPT']

const previewOf = (item: PickerItem) => {
    if (item.kind === 'SCRIPT') return `${item.language}(${item.parameters.map((parameter) => parameter.name).join(', ')})`
    return item.secret ? SECRET_MASK : item.valuePreview ?? ''
}

type Props = {
    value?: string
    onChange: (name: string) => void
    popupZIndex?: number
    disabled?: boolean
    className?: string
    testId?: string
    /** Narrows the offered variables, e.g. to the mutable ones a Set step may write. */
    filter?: (item: PickerItem) => boolean
}

// Scripts are listed but not pickable until the field call editor exists (phase 2): a script
// can't be referenced like a value, it must be called with its parameters.
export function GlobalVariableSelect({ value, onChange, popupZIndex, disabled, className, testId, filter }: Props) {
    const { t } = useI18n('entities')
    const { items, isLoading } = useGlobalVariablePicker()

    const options = useMemo(() => KIND_ORDER
        .map((kind) => ({
            label: t(`global-variable.kind.${kind}.label`),
            options: items.filter((item) => item.kind === kind && (!filter || filter(item))).map((item) => ({
                value: item.name,
                searchText: `${item.name} ${item.description}`,
                disabled: item.kind === 'SCRIPT',
                label: (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }} title={item.description}>
                        <GlobalVariableKindBadge kind={item.kind} isIconOnly />
                        <code>{item.name}</code>
                        <span style={{ opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.kind === 'SCRIPT' ? t('global-variable.picker.scriptLater') : previewOf(item)}
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
            style={{ minWidth: 220 }}
            popupMatchSelectWidth={false}
            getPopupContainer={() => document.body}
            styles={{ popup: { root: { zIndex: popupZIndex ?? 13010 } } }}
            data-testid={testId ?? 'global-variable-picker'}
        />
    )
}
