import { useI18n } from '@shared/i18n/hooks/useI18n'
import { parseGlobalReference } from '../../lib/globalReference'
import { SECRET_MASK } from '../../model/display'
import { useGlobalVariablePicker } from './globalPicker'

type GlobalReferenceInfo = {
    label: string
    /** Kind and value, the unknown-variable notice, or the raw reference while loading. */
    detail: string
    isUnknown: boolean
    /** What a constant stands for, for display only; null for other kinds and for a reference with a path. */
    constantValue: string | null
}

// The preview is the value as JSON text, cut to 100 characters: a whole JSON string reads better unquoted.
const displayPreview = (preview: string | null): string | null => {
    if (preview === null) return null
    try {
        const parsed: unknown = JSON.parse(preview)
        return typeof parsed === 'string' ? parsed : preview
    } catch {
        return preview
    }
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
    const constantValue = item?.kind === 'CONSTANT' && !parsed.path
        ? (item.secret ? SECRET_MASK : displayPreview(item.valuePreview))
        : null
    return { label: `${parsed.name}${parsed.path}`, detail, isUnknown, constantValue }
}
