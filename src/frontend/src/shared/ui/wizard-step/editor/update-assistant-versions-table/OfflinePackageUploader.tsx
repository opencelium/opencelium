import { useCallback, useEffect } from 'react'
import { Dropzone } from '@shared/ui/primitives/DropZone/DropZone'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useOfflinePackageUpload } from './useOfflinePackageUpload'
import {IconButton} from "@shared/ui/primitives/IconButton";
import { Icon } from '@shared/ui/primitives/Icon'
import { notifyError } from '@shared/ui/feedback/notifyError'

const MAX_PACKAGE_BYTES = 1024 * 1024 * 1024

type Props = {
    isCompact?: boolean
}

export function OfflinePackageUploader({ isCompact = false }: Props) {
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
            testId="update-assistant-package-dropzone"
            content={isCompact ? (
                <div className="ua-drop ua-drop--compact">
                    <span className="ua-drop__more">
                        <Icon name="upload" size={16} color="inherit" />
                        {t('update-assistant.availableUpdates.offline.upload.more')}
                    </span>
                    <span className="ua-drop__or">{t('update-assistant.availableUpdates.offline.upload.moreDrop')}</span>
                </div>
            ) : (
                <div className="ua-drop">
                    <span className="ua-drop__icon">
                        <Icon name="upload" size={20} color="inherit" />
                    </span>
                    <span className="ua-drop__label">{t('update-assistant.availableUpdates.offline.upload.dropLabel')}</span>
                    <span className="ua-drop__or">{t('update-assistant.availableUpdates.offline.upload.or')}</span>
                    <span className="ua-drop__browse">{t('update-assistant.availableUpdates.offline.upload.browse')}</span>
                    <span className="ua-drop__accepted">{t('update-assistant.availableUpdates.offline.upload.accepted')}</span>
                </div>
            )}
        />
    )
}
