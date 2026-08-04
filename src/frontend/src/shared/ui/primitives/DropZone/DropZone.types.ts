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
    /** Stable selector for e2e tests; emitted as `data-testid` on the dropzone. */
    testId?: string
}

export type DropzoneComponent = React.FC<DropzoneProps>
