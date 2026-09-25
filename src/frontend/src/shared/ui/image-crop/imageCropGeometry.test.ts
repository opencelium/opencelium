import { describe, expect, it } from 'vitest'
import {
    constrainPosition,
    getCropRect,
    getInitialPosition,
    getLayout,
    OUTPUT_LONG_SIDE,
    resolveRatio,
    VIEWPORT_SIZE,
} from '@shared/ui/image-crop/imageCropGeometry'

const WIDE = { width: 1200, height: 400 }
const TALL = { width: 400, height: 1000 }
const SQUARE = { width: 800, height: 800 }

describe('image crop geometry', () => {
    it('letterboxes the image into the square viewport', () => {
        const layout = getLayout(WIDE, 1, 1)

        expect(layout.width).toBe(VIEWPORT_SIZE)
        expect(layout.height).toBe(VIEWPORT_SIZE / 3)
        expect(layout.left).toBe(0)
        expect(layout.top).toBe((VIEWPORT_SIZE - VIEWPORT_SIZE / 3) / 2)
    })

    it('fits a square selection inside the shorter side, as the connector icon needs', () => {
        // The 1200x400 source is displayed 320x106.67, so a square can only be as wide
        // as that height — otherwise the selection would hang outside the picture.
        const layout = getLayout(WIDE, 1, 1)

        expect(layout.cropWidth).toBeCloseTo(layout.height)
        expect(layout.cropHeight).toBeCloseTo(layout.cropWidth)
    })

    it("takes the whole image when the ratio is the image's own", () => {
        for (const image of [WIDE, TALL, SQUARE]) {
            const layout = getLayout(image, 1, resolveRatio(image, 'image'))

            expect(layout.cropWidth).toBeCloseTo(layout.width)
            expect(layout.cropHeight).toBeCloseTo(layout.height)
        }
    })

    it('shrinks the selection by the zoom, keeping its ratio', () => {
        const layout = getLayout(WIDE, 2, 3)

        expect(layout.cropWidth).toBeCloseTo(VIEWPORT_SIZE / 2)
        expect(layout.cropWidth / layout.cropHeight).toBeCloseTo(3)
    })

    it('centres a fresh selection inside the image', () => {
        const ratio = 1
        const layout = getLayout(WIDE, 1, ratio)
        const position = getInitialPosition(WIDE, ratio)

        expect(position.x).toBeCloseTo((layout.width - layout.cropWidth) / 2)
        expect(position.y).toBeCloseTo(layout.top)
    })

    it('clamps a drag to the image on every edge', () => {
        const ratio = 1
        const layout = getLayout(WIDE, 1, ratio)
        const maxX = layout.left + layout.width - layout.cropWidth

        const topLeft = constrainPosition({ x: -500, y: -500 }, WIDE, 1, ratio)
        expect(topLeft.x).toBeCloseTo(layout.left)
        expect(topLeft.y).toBeCloseTo(layout.top)

        const bottomRight = constrainPosition({ x: 5000, y: 5000 }, WIDE, 1, ratio)
        expect(bottomRight.x).toBeCloseTo(maxX)
        expect(bottomRight.y).toBeCloseTo(layout.top + layout.height - layout.cropHeight)
    })

    it('maps the selection back to image pixels', () => {
        const ratio = resolveRatio(WIDE, 'image')
        const rect = getCropRect(WIDE, 1, ratio, getInitialPosition(WIDE, ratio))

        // Unzoomed and image-ratio: the whole 1200x400 source, offset at its origin.
        expect(rect.sourceX).toBeCloseTo(0)
        expect(rect.sourceY).toBeCloseTo(0)
        expect(rect.sourceWidth).toBeCloseTo(WIDE.width)
        expect(rect.sourceHeight).toBeCloseTo(WIDE.height)
    })

    // A canvas needs whole pixels, so the short side is the rounded ratio of the long one.
    it('caps the output long side and keeps the selection ratio', () => {
        const wide = getCropRect(WIDE, 1, resolveRatio(WIDE, 'image'), getInitialPosition(WIDE, 3))
        expect(wide.outputWidth).toBe(OUTPUT_LONG_SIDE)
        expect(wide.outputHeight).toBe(Math.round(OUTPUT_LONG_SIDE / 3))

        const tall = getCropRect(TALL, 1, resolveRatio(TALL, 'image'), getInitialPosition(TALL, 0.4))
        expect(tall.outputHeight).toBe(OUTPUT_LONG_SIDE)
        expect(tall.outputWidth).toBe(Math.round(OUTPUT_LONG_SIDE * 0.4))
    })

    it('still writes a square 512 for a square crop, as it did before it was shared', () => {
        const rect = getCropRect(SQUARE, 1.5, 1, getInitialPosition(SQUARE, 1))

        expect(rect.outputWidth).toBe(OUTPUT_LONG_SIDE)
        expect(rect.outputHeight).toBe(OUTPUT_LONG_SIDE)
        expect(rect.sourceWidth).toBeCloseTo(SQUARE.width / 1.5)
    })
})
