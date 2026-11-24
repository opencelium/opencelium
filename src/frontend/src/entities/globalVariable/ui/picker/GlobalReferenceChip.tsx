import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { ReferenceChip } from '@shared/ui/reference-chip/ReferenceChip'
import { useGlobalReferenceInfo } from './useGlobalReferenceInfo'

type Props = {
    reference: string
    /** Off where the host shows the details itself, e.g. in a hover menu the tooltip would cover. */
    hasTooltip?: boolean
    /** Shows a constant's value instead of its name; the reference itself stays what is saved. */
    showsConstantValue?: boolean
}

// Same accent as global references in the workflow editor's chips.
const GLOBAL_CHIP_COLOR = 'var(--color-action-primary)'

// Display only — editing and removing come from the host. Uses the shared reference chip, so a global
// reads the same here as in the workflow editor.
export function GlobalReferenceChip({ reference, hasTooltip = true, showsConstantValue = false }: Props) {
    const { t } = useI18n('entities')
    const info = useGlobalReferenceInfo(reference)
    if (!info) return null
    const shownValue = showsConstantValue ? info.constantValue : null

    const chip = (
        <ReferenceChip color={GLOBAL_CHIP_COLOR} source={t('global-variable.picker.chipSource')}
            path={shownValue ?? info.label} tone={info.isUnknown ? 'error' : 'default'} testId="global-reference-chip" />
    )
    const tooltip = shownValue === null ? info.detail : `${info.label} · ${info.detail}`
    return hasTooltip ? <Tooltip content={tooltip} placement="top" zIndex={30000}><span>{chip}</span></Tooltip> : chip
}
