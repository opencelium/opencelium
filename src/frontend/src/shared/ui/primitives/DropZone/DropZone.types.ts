import type React from 'react'

export interface DropzoneProps {
    onFiles: (files: File[]) => void

    multiple?: boolean
    accept?: string
    disabled?: boolean
    label?: string
    hint?: string
    className?: string
    style?: React.CSSProperties
}

export type DropzoneComponent = React.FC<DropzoneProps>
