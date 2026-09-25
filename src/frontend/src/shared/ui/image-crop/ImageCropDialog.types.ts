export type ImageCropDialogProps = {
    /** Open while a file is staged; `null` closes the dialog. */
    file: File | null
    /**
     * Width/height the selection is locked to. `'image'` locks it to the source's own
     * ratio, which is what a picture with no target shape (a logo) wants — the selection
     * then starts as the whole image and zooming only trims it. Defaults to a square.
     */
    aspect?: number | 'image'
    onCancel: () => void
    onConfirm: (file: File) => void
    /** Already-translated copy — this dialog resolves no i18n keys of its own. */
    title: string
    zoomLabel: string
    cancelLabel: string
    confirmLabel: string
    instruction: string
}
