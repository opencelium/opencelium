import {useEffect, useMemo} from 'react'
import {useFormContext, useWatch} from 'react-hook-form'
import type {Mode} from '@/engine/entity/EntityDefinition'
import {useConfirm} from '@shared/ui/confirm/ConfirmDialogContext'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {ImageTileEditor} from './ImageTileEditor'
import {wrapperStyle} from './WizardImageEditor.styles'

type Props = {
    mode?: Mode
    /** Form field holding the image: File = upload/replace, null = delete, string = unchanged. */
    fieldName?: string
    /** See ImageTileEditor; `confirmDelete.{title,message}` is also needed when `canDelete`. */
    i18nPrefix: string
    resolveUrl: (path: string) => string | null
    testIdPrefix: string
    canDelete?: boolean
}

const isFileValue = (value: unknown): value is File =>
    typeof File !== 'undefined' && value instanceof File

const displayNameFor = (selected: unknown): string => {
    if (isFileValue(selected)) return selected.name
    if (typeof selected === 'string' && selected.trim()) {
        return selected.split('/').pop() || selected
    }
    return ''
}

/**
 * The wizard's top-right image as an editor, plugged in through `wizard.renderImage`.
 * It only stages the change in the form field; the entity's after-save actions turn
 * it into the actual upload/delete requests.
 */
export const WizardImageEditor = ({
    mode, fieldName = 'icon', i18nPrefix, resolveUrl, testIdPrefix, canDelete = true,
}: Props) => {
    const {setValue} = useFormContext()
    const {t} = useI18n('entities')
    const confirm = useConfirm()

    const fieldValue = useWatch({name: fieldName})
    const selected = Array.isArray(fieldValue) ? fieldValue[0] : fieldValue

    const objectUrl = useMemo(
        () => (isFileValue(selected) ? URL.createObjectURL(selected) : null),
        [selected],
    )
    useEffect(() => {
        if (!objectUrl) return
        return () => URL.revokeObjectURL(objectUrl)
    }, [objectUrl])

    const storedPath = typeof selected === 'string' && selected.trim() ? selected : null

    const handleDelete = async () => {
        const ok = await confirm({
            title: t(`${i18nPrefix}.confirmDelete.title`),
            message: t(`${i18nPrefix}.confirmDelete.message`),
        })
        if (!ok) return
        setValue(fieldName, null, {shouldDirty: true})
    }

    return (
        <div style={wrapperStyle}>
            <ImageTileEditor
                src={objectUrl ?? (storedPath ? resolveUrl(storedPath) : null)}
                fileName={displayNameFor(selected)}
                isInteractive={mode !== 'view'}
                i18nPrefix={i18nPrefix}
                testIdPrefix={testIdPrefix}
                onPicked={file => setValue(fieldName, file, {shouldDirty: true})}
                onDelete={canDelete ? handleDelete : undefined}
            />
        </div>
    )
}
