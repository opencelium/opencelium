import React, { useCallback, useEffect } from 'react'
import { Dropzone } from '@shared/ui/primitives/DropZone/DropZone'
import { Button } from '@shared/ui/primitives/Button'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useOfflinePackageUpload } from './useOfflinePackageUpload'
import {IconButton} from "@shared/ui/primitives/IconButton";

export function OfflinePackageUploader() {
    const { t } = useI18n('entities')
    const { state, upload, cancel, reset } = useOfflinePackageUpload()

    const handleFiles = useCallback(
        (files: File[]) => {
            const file = files[0]
            if (file) upload(file)
        },
        [upload],
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
