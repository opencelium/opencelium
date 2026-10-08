import {useRef, useState, type ChangeEvent} from 'react'
import {useI18n} from '@shared/i18n/hooks/useI18n'
import {notifyError} from '@shared/ui/feedback/notifyError'
import {validateImageUpload} from '@shared/utils/imageUploadRules'

type Options = {
    i18nPrefix: string
    onPicked: (file: File) => void
}

/** Native picker → type/size check → square crop → `onPicked` with the cropped file. */
export function useImagePicker({i18nPrefix, onPicked}: Options) {
    const {t} = useI18n('entities')
    const inputRef = useRef<HTMLInputElement>(null)
    const [cropFile, setCropFile] = useState<File | null>(null)

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
        setCropFile(null)
        onPicked(file)
    }

    return {
        t,
        inputRef,
        cropFile,
        openPicker: () => inputRef.current?.click(),
        cancelCrop: () => setCropFile(null),
        handlePick,
        handleCropConfirm,
    }
}
