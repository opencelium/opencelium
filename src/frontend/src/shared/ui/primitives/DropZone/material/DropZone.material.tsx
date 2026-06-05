import React, { useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import type { DropzoneComponent } from '../DropZone.types'
import { useI18n } from '@shared/i18n/hooks/useI18n'

export const MaterialDropzone: DropzoneComponent = ({
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
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    const handleFiles = (rawFiles: FileList | null) => {
        if (!rawFiles || disabled) return
        onFiles(Array.from(rawFiles))
    }

    return (
        <Box
            className={className}
            style={style}
            onClick={() => !disabled && inputRef.current?.click()}
            onDragOver={(e) => {
                e.preventDefault()
                if (!disabled) setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFiles(e.dataTransfer.files)
            }}
            sx={{
                border: `2px dashed`,
                borderColor: isDragging
                    ? 'primary.main'
                    : 'var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 16px',
                background: isDragging
                    ? 'var(--color-action-primary-subtle)'
                    : 'var(--color-background-surface)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                opacity: disabled ? 0.5 : 1,
                transition: 'border-color 0.2s, background 0.2s',
                userSelect: 'none',
            }}
        >
            <input
                ref={inputRef}
                type="file"
                hidden
                multiple={multiple}
                accept={accept}
                disabled={disabled}
                onChange={(e) => handleFiles(e.target.files)}
            />

            <Typography variant="body1" fontWeight={500}>
                {label ?? t('common.dropzone.label', { defaultValue: 'Click or drag file to this area' })}
            </Typography>

            {hint && (
                <Typography variant="body2" color="text.secondary">
                    {hint}
                </Typography>
            )}
        </Box>
    )
}
