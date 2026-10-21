import type React from 'react'

export interface DropzoneProps {
    onFiles: (files: File[]) => void

    multiple?: boolean
    accept?: string
    disabled?: boolean
    label?: string
    hint?: string
    /** Replaces the default icon / label / hint body; the whole area stays the click and drop target. */
    content?: React.ReactNode
    className?: string
    style?: React.CSSProperties
    /** Stable selector for e2e tests; emitted as `data-testid` on the dropzone. */
    testId?: string
}

export type DropzoneComponent = React.FC<DropzoneProps>
