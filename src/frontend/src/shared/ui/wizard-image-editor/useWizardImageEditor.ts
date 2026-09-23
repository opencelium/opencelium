import {useEffect, useMemo, useRef, useState, type ChangeEvent} from 'react'
import {useFormContext, useWatch} from 'react-hook-form'
import {useConfirm} from '@shared/ui/confirm/ConfirmDialogContext'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {notifyError} from '@shared/ui/feedback/notifyError'
import {validateImageUpload} from '@shared/utils/imageUploadRules'

const isFileValue = (value: unknown): value is File =>
    typeof File !== 'undefined' && value instanceof File

const displayNameFor = (selected: unknown): string => {
    if (isFileValue(selected)) return selected.name
    if (typeof selected === 'string' && selected.trim()) {
        return selected.split('/').pop() || selected
    }
    return ''
}

type Options = {
    fieldName: string
    i18nPrefix: string
    resolveUrl: (path: string) => string | null
}

/**
 * Stages the image change in the form field: a File means upload/replace, null means
 * delete, a string is the untouched stored path. The entity's after-save actions
 * turn that into the actual requests.
 */
export function useWizardImageEditor({fieldName, i18nPrefix, resolveUrl}: Options) {
    const {setValue} = useFormContext()
    const {t} = useI18n('entities')
    const confirm = useConfirm()
    const inputRef = useRef<HTMLInputElement>(null)
    const [cropFile, setCropFile] = useState<File | null>(null)

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
    const src = objectUrl ?? (storedPath ? resolveUrl(storedPath) : null)

    const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        // Reset so picking the same file again still fires onChange.
        event.target.value = ''
        if (!file) return
        const rejection = validateImageUpload(file)
        if (rejection) {
            notifyError(t(`${i18nPrefix}.${rejection}`))
            return
        }
        setCropFile(file)
    }

    const handleCropConfirm = (file: File) => {
        setValue(fieldName, file, {shouldDirty: true})
        setCropFile(null)
    }

    const handleDelete = async () => {
        const ok = await confirm({
            title: t(`${i18nPrefix}.confirmDelete.title`),
            message: t(`${i18nPrefix}.confirmDelete.message`),
        })
        if (!ok) return
        setValue(fieldName, null, {shouldDirty: true})
    }

    return {
        t,
        inputRef,
        cropFile,
        src,
        fileName: displayNameFor(selected),
        openPicker: () => inputRef.current?.click(),
        cancelCrop: () => setCropFile(null),
        handlePick,
        handleCropConfirm,
        handleDelete,
    }
}
