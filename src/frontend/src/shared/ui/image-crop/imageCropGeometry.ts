/** Pure geometry behind ImageCropDialog: viewport layout, drag clamping, output rect. */

export const VIEWPORT_SIZE = 320
// Long side of the written file: enough for every place an icon or logo is drawn, and
// small enough that the crop doubles as a downscale of a multi-megabyte upload.
export const OUTPUT_LONG_SIDE = 512

export type Size = { width: number; height: number }
export type Position = { x: number; y: number }

export type CropLayout = {
    /** Displayed pixels per natural pixel, from letterboxing the image into the viewport. */
    displayScale: number
    width: number
    height: number
    left: number
    top: number
    cropWidth: number
    cropHeight: number
}

export const resolveRatio = (image: Size, aspect: number | 'image'): number =>
    aspect === 'image' ? image.width / image.height : aspect

/**
 * The image letterboxed into the square viewport, plus the largest selection of `ratio`
 * that fits inside it, shrunk by the zoom. When `ratio` is the image's own, the selection
 * at zoom 1 is exactly the whole image.
 */
export const getLayout = (image: Size, zoom: number, ratio: number): CropLayout => {
    const displayScale = Math.min(VIEWPORT_SIZE / image.width, VIEWPORT_SIZE / image.height)
    const width = image.width * displayScale
    const height = image.height * displayScale
    const cropWidth = Math.min(width, height * ratio) / zoom
    return {
        displayScale,
        width,
        height,
        left: (VIEWPORT_SIZE - width) / 2,
        top: (VIEWPORT_SIZE - height) / 2,
        cropWidth,
        cropHeight: cropWidth / ratio,
    }
}

/** Keeps the selection inside the displayed image while dragging or zooming. */
export const constrainPosition = (
    position: Position,
    image: Size,
    zoom: number,
    ratio: number,
): Position => {
    const layout = getLayout(image, zoom, ratio)
    return {
        x: Math.max(layout.left, Math.min(layout.left + layout.width - layout.cropWidth, position.x)),
        y: Math.max(layout.top, Math.min(layout.top + layout.height - layout.cropHeight, position.y)),
    }
}

/** Where the selection starts inside the image, centred, for a freshly loaded file. */
export const getInitialPosition = (image: Size, ratio: number): Position => {
    const layout = getLayout(image, 1, ratio)
    return {
        x: layout.left + (layout.width - layout.cropWidth) / 2,
        y: layout.top + (layout.height - layout.cropHeight) / 2,
    }
}

export type CropRect = {
    /** Source rectangle in the image's own pixels — the first half of drawImage. */
    sourceX: number
    sourceY: number
    sourceWidth: number
    sourceHeight: number
    /** Canvas size the selection is drawn into, long side capped at OUTPUT_LONG_SIDE. */
    outputWidth: number
    outputHeight: number
}

/** Translates the on-screen selection back into image pixels and an output canvas size. */
export const getCropRect = (
    image: Size,
    zoom: number,
    ratio: number,
    position: Position,
): CropRect => {
    const layout = getLayout(image, zoom, ratio)
    const sourceWidth = layout.cropWidth / layout.displayScale
    const sourceHeight = layout.cropHeight / layout.displayScale
    const outputScale = OUTPUT_LONG_SIDE / Math.max(sourceWidth, sourceHeight)
    return {
        sourceX: (position.x - layout.left) / layout.displayScale,
        sourceY: (position.y - layout.top) / layout.displayScale,
        sourceWidth,
        sourceHeight,
        outputWidth: Math.round(sourceWidth * outputScale),
        outputHeight: Math.round(sourceHeight * outputScale),
    }
}
