import { Tag } from 'antd'
import { Icon } from '@shared/ui/primitives/Icon'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { useGlobalReferenceInfo } from './useGlobalReferenceInfo'

type Props = {
    reference: string
    /** Off where the host shows the details itself, e.g. in a hover menu the tooltip would cover. */
    hasTooltip?: boolean
    /** Shows a constant's value instead of its name; the reference itself stays what is saved. */
    showsConstantValue?: boolean
}

// Display only — editing and removing come from the host's hover menu.
// One look for every global reference — teal, like the global variable artwork — so it never reads as a
// webhook (grey) or a method reference (colour box).
export function GlobalReferenceChip({ reference, hasTooltip = true, showsConstantValue = false }: Props) {
    const info = useGlobalReferenceInfo(reference)
    if (!info) return null
    const shownValue = showsConstantValue ? info.constantValue : null

    const chip = (
        <Tag
            color={info.isUnknown ? 'error' : 'cyan'}
            icon={<Icon name={info.isUnknown ? 'warning' : 'global-variable'} size={12} color="inherit" />}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginInlineEnd: 0, maxWidth: 260, fontFamily: 'monospace' }}
            data-testid="global-reference-chip"
        >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shownValue ?? info.label}</span>
        </Tag>
    )
    const tooltip = shownValue === null ? info.detail : `${info.label} · ${info.detail}`
    return hasTooltip ? <Tooltip content={tooltip} placement="top" zIndex={30000}>{chip}</Tooltip> : chip
}
