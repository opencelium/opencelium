import { Tag } from 'antd'
import { Icon } from '@shared/ui/primitives/Icon'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { parseGlobalReference } from '../../lib/globalReference'
import { SECRET_MASK } from '../../model/display'
import { useGlobalVariablePicker } from './globalPicker'

const KIND_COLOR = { CONSTANT: 'default', MUTABLE: 'gold', SCRIPT: 'purple' } as const
const KIND_ICON = { CONSTANT: 'lock', MUTABLE: 'refresh', SCRIPT: 'code' } as const

type Props = {
    reference: string
    onRemove?: () => void
}

// A user without VIEW_USE gets no picker entry, so the chip falls back to the bare name (FR-61).
export function GlobalReferenceChip({ reference, onRemove }: Props) {
    const { t } = useI18n('entities')
    const { items } = useGlobalVariablePicker()
    const parsed = parseGlobalReference(reference)
    if (!parsed) return null
    const item = items.find((candidate) => candidate.name === parsed.name)
    const value = !item || item.kind === 'SCRIPT' ? null : item.secret ? SECRET_MASK : item.valuePreview
    const tooltip = item
        ? `${t(`global-variable.kind.${item.kind}.label`)} · ${value ?? item.description}`
        : t('global-variable.picker.unknown')

    return (
        <Tooltip content={tooltip} placement="top" zIndex={30000}>
            <Tag
                color={item ? KIND_COLOR[item.kind] : 'default'}
                icon={<Icon name={item ? KIND_ICON[item.kind] : 'warning'} size={12} />}
                closable={!!onRemove}
                onClose={(event) => { event.preventDefault(); onRemove?.() }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginInlineEnd: 0, maxWidth: 260 }}
                data-testid="global-reference-chip"
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {`${parsed.name}${parsed.path}`}
                </span>
            </Tag>
        </Tooltip>
    )
}
