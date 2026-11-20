import { useI18n } from '@shared/i18n/hooks/useI18n'
import { parseGlobalReference } from '../../lib/globalReference'
import { SECRET_MASK } from '../../model/display'
import { useGlobalVariablePicker } from './globalPicker'

type GlobalReferenceInfo = {
    label: string
    /** Kind and value, the unknown-variable notice, or the raw reference while loading. */
    detail: string
    isUnknown: boolean
}

// A user without VIEW_USE gets no picker entry, so the chip falls back to the bare name (FR-61).
export function useGlobalReferenceInfo(reference: string): GlobalReferenceInfo | null {
    const { t } = useI18n('entities')
    const { items, isLoading } = useGlobalVariablePicker()
    const parsed = parseGlobalReference(reference)
    if (!parsed) return null
    const item = items.find((candidate) => candidate.name === parsed.name)
    const isUnknown = !item && !isLoading
    const value = !item || item.kind === 'SCRIPT' ? null : item.secret ? SECRET_MASK : item.valuePreview
    const detail = item
        ? `${t(`global-variable.kind.${item.kind}.label`)} · ${value ?? item.description}`
        : isUnknown ? t('global-variable.picker.unknown') : reference
    return { label: `${parsed.name}${parsed.path}`, detail, isUnknown }
}
