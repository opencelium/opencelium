export const isImageFile = (value: unknown): value is File =>
    typeof File !== 'undefined' && value instanceof File
