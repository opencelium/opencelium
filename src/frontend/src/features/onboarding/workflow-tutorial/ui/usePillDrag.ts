import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from 'react'

type Position = { left: number; top: number; width: number }
/** `width` is pinned because the narrow-screen layout sizes the pill from `left` + `right`. */
type DragStart = { offsetX: number; offsetY: number; width: number }

/** Kept clear of the viewport edge so the handle can always be grabbed again. */
const EDGE_GAP = 8

const clamp = (position: Position, pill: HTMLElement): Position => {
    const { width, height } = pill.getBoundingClientRect()
    return {
        width: position.width,
        left: Math.min(Math.max(position.left, EDGE_GAP), Math.max(EDGE_GAP, window.innerWidth - width - EDGE_GAP)),
        top: Math.min(Math.max(position.top, EDGE_GAP), Math.max(EDGE_GAP, window.innerHeight - height - EDGE_GAP)),
    }
}

type UsePillDragArgs = {
    pillRef: RefObject<HTMLElement | null>
    isEnabled: boolean
    /** A change drops the dragged position, so the pill returns to its step's corner. */
    resetKey: string
}

/**
 * The position lives only for the current `resetKey` (the step's anchor): a step that
 * moves the pill to another corner does so to clear a panel it describes, and a
 * position dragged for the previous corner would put it straight back on top of it.
 */
export function usePillDrag({ pillRef, isEnabled, resetKey }: UsePillDragArgs) {
    const [position, setPosition] = useState<Position | null>(null)
    const [trackedKey, setTrackedKey] = useState(resetKey)
    const dragStart = useRef<DragStart | null>(null)

    if (trackedKey !== resetKey) {
        setTrackedKey(resetKey)
        setPosition(null)
    }

    const activePosition = isEnabled ? position : null

    useEffect(() => {
        if (!activePosition) return
        const onResize = () => setPosition(current =>
            current && pillRef.current ? clamp(current, pillRef.current) : current)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [activePosition, pillRef])

    const onPointerDown = (event: PointerEvent<HTMLElement>) => {
        const pill = pillRef.current
        if (!isEnabled || !pill || event.button !== 0) return
        const rect = pill.getBoundingClientRect()
        dragStart.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, width: rect.width }
        event.currentTarget.setPointerCapture(event.pointerId)
        event.preventDefault()
    }

    const onPointerMove = (event: PointerEvent<HTMLElement>) => {
        const start = dragStart.current
        const pill = pillRef.current
        if (!start || !pill) return
        setPosition(clamp({ left: event.clientX - start.offsetX, top: event.clientY - start.offsetY, width: start.width }, pill))
    }

    const onPointerEnd = (event: PointerEvent<HTMLElement>) => {
        if (!dragStart.current) return
        dragStart.current = null
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    const style: CSSProperties | undefined = activePosition
        ? { ...activePosition, right: 'auto', bottom: 'auto', transform: 'none' }
        : undefined

    return {
        style,
        handleProps: isEnabled
            ? { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd }
            : {},
    }
}
