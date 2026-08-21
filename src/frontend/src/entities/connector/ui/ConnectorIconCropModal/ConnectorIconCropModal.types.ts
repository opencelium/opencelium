export type ConnectorIconCropModalProps = {
    file: File | null
    onCancel: () => void
    onConfirm: (file: File) => void
    title: string
    zoomLabel: string
    cancelLabel: string
    confirmLabel: string
    instruction: string
}
