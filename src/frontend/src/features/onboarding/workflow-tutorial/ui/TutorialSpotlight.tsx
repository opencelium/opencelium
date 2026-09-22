import { useEffect, useState } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { Icon } from '@shared/ui/primitives/Icon'
import { ONBOARDING_Z_INDEX } from '../../model/types'
import { findVisibleTarget } from '../model/findVisibleTarget'
import type { TutorialTarget } from '../model/tutorialSteps'
import './tutorialSpotlight.css'

/** Breathing room around the undimmed area, in px. */
const PADDING = 8
/** How far above the target the cue badge sits, in px. */
const CUE_OFFSET = 30
/** One glyph for both gestures — the device is the same; the word tells them apart. */
const CUE_LABEL: Record<NonNullable<TutorialTarget['cue']>, string> = {
    'right-click': 'workflow.cues.rightClick',
    'double-click': 'workflow.cues.doubleClick',
    reference: 'workflow.cues.reference',
}
/** The reference cue points at an affordance of its own; the others at the mouse. */
const CUE_ICON = { 'right-click': 'mouse', 'double-click': 'mouse', reference: 'link' } as const
const HIGHLIGHT_ATTR = 'data-tutorial-highlight'

type Rect = { top: number; left: number; width: number; height: number }

const union = (first: DOMRect, rest: DOMRect[], by: number): Rect => {
    const rects = [first, ...rest]
    const top = Math.min(...rects.map(r => r.top))
    const left = Math.min(...rects.map(r => r.left))
    const right = Math.max(...rects.map(r => r.right))
    const bottom = Math.max(...rects.map(r => r.bottom))
    return { top: top - by, left: left - by, width: right - left + by * 2, height: bottom - top + by * 2 }
}

const laidOut = (rect: DOMRect | undefined) => !!rect && (rect.width > 0 || rect.height > 0)

const same = (a: Rect, b: Rect) =>
    a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height

/** Marks the target so CSS can force it visible; the canvas hides some at opacity 0. */
const mark = (element: HTMLElement | null) => {
    document.querySelectorAll(`[${HIGHLIGHT_ATTR}]`).forEach(previous => {
        if (previous !== element) previous.removeAttribute(HIGHLIGHT_ATTR)
    })
    element?.setAttribute(HIGHLIGHT_ATTR, '')
}

type SpotlightProps = {
    /** The control to click. */
    target: string | null
    /**
     * Extra elements to leave undimmed with it — the node a `+` belongs to, say.
     * A lone 14px icon in a dark hole reads as an artefact; its node gives it
     * context. They cannot simply be raised: the canvas viewport is transformed,
     * which traps every z-index inside it below a fixed overlay.
     */
    include?: string[]
    /** How to act on the target, when the gesture is not self-evident. */
    cue?: TutorialTarget['cue']
    /** Narrows the match to an element showing this text — see TutorialTarget. */
    text?: TutorialTarget['text']
}

/**
 * Dims everything except one region, with an outsized box-shadow as the mask so the
 * cut-out stays clickable — the same trick the onboarding tour uses for the command
 * palette. Nothing is re-parented, so the highlighted control keeps working.
 *
 * The cut-out is the only overlay: what to click is called out by recolouring the
 * control itself (see `[data-tutorial-highlight]`), not by drawing a border around it.
 *
 * Tracked on an animation frame: the sidebar drawers slide and the canvas pans, and
 * the highlight has to follow mid-animation.
 */
export function TutorialSpotlight({ target, include, cue, text }: SpotlightProps) {
    const { t } = useI18n('onboarding')
    const [state, setState] = useState<{ target: string; hole: Rect } | null>(null)

    useEffect(() => {
        if (!target) return

        let frame = 0
        const track = () => {
            const element = findVisibleTarget(target, text)
            mark(element)

            const targetRect = element?.getBoundingClientRect()
            const extraRects = (include ?? [])
                .map(selector => findVisibleTarget(selector)?.getBoundingClientRect())
                .filter((rect): rect is DOMRect => laidOut(rect))

            // Never clears: a hole that cannot be measured this frame leaves the last
            // one in place. Dropping it would un-dim the whole page for a frame, and
            // the caller already passes `target: null` when there is nothing to point
            // at, which is the one case that really should remove the mask.
            setState(current => {
                if (!targetRect || !laidOut(targetRect)) return current
                const hole = union(targetRect, extraRects, PADDING)
                if (current?.target === target && same(current.hole, hole)) return current
                return { target, hole }
            })
            frame = requestAnimationFrame(track)
        }
        frame = requestAnimationFrame(track)
        return () => {
            cancelAnimationFrame(frame)
            mark(null)
        }
    }, [include, target, text])

    // Deliberately not gated on `state.target === target`: the mask stays where it was
    // for the frame it takes to measure a new target. Blanking it there un-dimmed the
    // entire page between every click and the next measurement, which read as the page
    // blinking on every action.
    if (!target || !state) return null

    return (
        <>
            <div
                aria-hidden
                className="workflow-tutorial-mask"
                style={{ ...state.hole, zIndex: ONBOARDING_Z_INDEX.backdrop }}
            />
            {cue && (
                // Above the mask rather than inside its hole: the badge hangs over the
                // node's own edge, which the cut-out does not reach.
                <div
                    className="workflow-tutorial-cue"
                    style={{
                        top: Math.max(PADDING, state.hole.top - CUE_OFFSET),
                        left: state.hole.left,
                        zIndex: ONBOARDING_Z_INDEX.tooltip,
                    }}
                >
                    <Icon name={CUE_ICON[cue]} size={13} color="inherit" />
                    <span>{t(CUE_LABEL[cue])}</span>
                </div>
            )}
        </>
    )
}
