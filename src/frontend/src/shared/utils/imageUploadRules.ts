// SVG is deliberately not accepted by the backend, so don't offer it in the file dialog.
export const IMAGE_UPLOAD_ACCEPT = '.png,.jpg,.jpeg,image/png,image/jpeg'
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg']

export type ImageUploadRejection = 'invalidType' | 'tooLarge'

/** The extension is what the backend validates on, not the browser's MIME guess. */
export const validateImageUpload = (file: File): ImageUploadRejection | null => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) return 'invalidType'
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) return 'tooLarge'
    return null
}
