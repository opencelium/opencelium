export type Point = { x: number; y: number }
type Box = { left: number; top: number; right: number; bottom: number }

/** Keeps the perched bee (24px, centred on its point) fully on screen. */
const EDGE = 16
const MIN_FLIGHT_MS = 550
const MAX_FLIGHT_MS = 950
/** Moves shorter than this (the canvas panning under the bee) are followed directly, without a flight. */
export const FOLLOW_PX = 48
const MAX_BANK_DEG = 14

export const distance = (from: Point, to: Point) => Math.hypot(to.x - from.x, to.y - from.y)

/** Longer trips take longer, within bounds: a short hop still reads as a flight, a long one never drags. */
export function flightDuration(px: number): number {
    return Math.round(Math.min(MAX_FLIGHT_MS, Math.max(MIN_FLIGHT_MS, 420 + px * 0.5)))
}

/** The bee leans into the direction it travels. */
export function bankToward(from: Point, to: Point): number {
    if (to.x === from.x) return 0
    return to.x > from.x ? MAX_BANK_DEG : -MAX_BANK_DEG
}

/** Where the bee perches on an element: its top-right corner, pulled inside the viewport. */
export function perchOn(box: Box, viewport: { width: number; height: number }): Point {
    return {
        x: Math.min(viewport.width - EDGE, Math.max(EDGE, box.right)),
        y: Math.min(viewport.height - EDGE, Math.max(EDGE, box.top)),
    }
}

export const centerOf = (box: Box): Point => ({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 })
