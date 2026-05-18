import React, { useRef, useState } from 'react'
import { Upload } from 'antd'
import type { DropzoneComponent } from '../DropZone.types'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import './DropZone.ant.css'

const { Dragger } = Upload

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path
                d="M9 1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6L9 1Z"
                stroke="currentColor" strokeWidth="1.2" fill="none"
            />
            <path d="M9 1v5h5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        </svg>
    )
}

export const AntDropzone: DropzoneComponent = ({
    onFiles,
    multiple = false,
    accept,
    disabled = false,
    label,
    hint,
    className,
    style,
}) => {
    const { t } = useI18n()
    const [files, setFiles] = useState<File[]>([])
    // batch ref: antd calls beforeUpload once per file in a drop
    const batchRef = useRef<File[]>([])

    const commitFiles = (incoming: File[]) => {
        const next = multiple ? [...files, ...incoming] : incoming
        setFiles(next)
        onFiles(next)
    }

    const removeFile = (index: number) => {
        const next = files.filter((_, i) => i !== index)
        setFiles(next)
        onFiles(next)
    }

    return (
        <div className={className} style={{ ...style, width: '100%'}}>
            <Dragger
                multiple={multiple}
                accept={accept}
                disabled={disabled}
                showUploadList={false}
                beforeUpload={(file, fileList) => {
                    batchRef.current.push(file as unknown as File)
                    if (batchRef.current.length === fileList.length) {
                        commitFiles(batchRef.current)
                        batchRef.current = []
                    }
                    return false
                }}
            >
                <p className="ant-upload-drag-icon" style={{ margin: '8px 0' }}>
                    <span style={{ fontSize: 32 }}>📁</span>
                </p>
                <p className="ant-upload-text" style={{ margin: '4px 0' }}>
                    {label ?? t('common.dropzone.label', { defaultValue: 'Click or drag file to this area' })}
                </p>
                {hint && (
                    <p className="ant-upload-hint" style={{ margin: '4px 0' }}>
                        {hint}
                    </p>
                )}
            </Dragger>

            {files.length > 0 && (
                <ul className="dz-file-list">
                    {files.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="dz-file-item">
                            <span className="dz-file-item__icon">
                                <FileIcon />
                            </span>
                            <span className="dz-file-item__name" title={file.name}>
                                {file.name}
                            </span>
                            <span className="dz-file-item__size">
                                {formatBytes(file.size)}
                            </span>
                            <button
                                type="button"
                                className="dz-file-item__remove"
                                onClick={() => removeFile(index)}
                                aria-label={`Remove ${file.name}`}
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
