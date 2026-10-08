import { useCallback, useEffect } from 'react'
import { Dropzone } from '@shared/ui/primitives/DropZone/DropZone'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useOfflinePackageUpload } from './useOfflinePackageUpload'
import {IconButton} from "@shared/ui/primitives/IconButton";
import { notifyError } from '@shared/ui/feedback/notifyError'

const MAX_PACKAGE_BYTES = 1024 * 1024 * 1024

export function OfflinePackageUploader() {
    const { t } = useI18n('entities')
    const { state, upload, cancel, reset } = useOfflinePackageUpload()

    // Drag-and-drop bypasses the Dropzone's `accept` filter, so the extension is checked here too.
    const handleFiles = useCallback(
        (files: File[]) => {
            const file = files[0]
            if (!file) return
            if (!file.name.toLowerCase().endsWith('.zip')) {
                notifyError(t('update-assistant.versions.upload.invalidType'))
                return
            }
            if (file.size > MAX_PACKAGE_BYTES) {
                notifyError(t('update-assistant.versions.upload.tooLarge'))
                return
            }
            upload(file)
        },
        [upload, t],
    )

    useEffect(() => {
        if (state.status !== 'success') return
        const id = window.setTimeout(reset, 1500)
        return () => window.clearTimeout(id)
    }, [state.status, reset])

    if (state.status === 'uploading') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t('update-assistant.versions.upload.uploading', {
                            fileName: state.fileName,
                            progress: state.progress,
                        })}
                    </span>

                    <IconButton
                        type="text"
                        size={'xs'}
                        iconProps={{ name: 'close' }}
                        onClick={cancel}
                    />
                </div>
                <div className="file-item__progress">
                    <div
                        className="file-item__progress-bar"
                        style={{ width: `${state.progress}%` }}
                    />
                </div>
            </div>
        )
    }

    return (
        <Dropzone
            accept=".zip"
            onFiles={handleFiles}
            label={t('update-assistant.versions.upload.button')}
        />
    )
}
