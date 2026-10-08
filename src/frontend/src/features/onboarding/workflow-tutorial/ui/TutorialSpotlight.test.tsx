import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@shared/ui/primitives/Icon', () => ({ Icon: () => <i data-testid="cue-icon" /> }))

import { TutorialSpotlight } from './TutorialSpotlight'

const MASK = '.workflow-tutorial-mask'

/** jsdom reports 0x0 for everything, so give each element a measurable box. */
const place = (selector: string, left: number, top = 0, height = 20) => {
    const element = document.createElement('div')
    element.className = selector.replace('.', '')
    element.getBoundingClientRect = () => ({
        width: 20, height, top, left, right: left + 20, bottom: top + height,
        x: left, y: top, toJSON: () => ({}),
    })
    document.body.appendChild(element)
    return element
}

const mask = () => document.querySelector<HTMLElement>(MASK)
const cue = () => document.querySelector<HTMLElement>('.workflow-tutorial-cue')

describe('TutorialSpotlight', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('renders nothing when there is no target to point at', () => {
        render(<TutorialSpotlight target={null} />)
        expect(mask()).toBeNull()
    })

    it('cuts a hole around the target', async () => {
        place('.a', 100)
        render(<TutorialSpotlight target=".a" />)
        await waitFor(() => expect(mask()).not.toBeNull())
        // 20px box at x=100, padded by 8 on each side.
        expect(mask()!.style.left).toBe('92px')
        expect(mask()!.style.width).toBe('36px')
    })

    // A picker's list is portalled below the row it belongs to. Undimming it means the
    // cut-out has to reach down over the options, or they stay unreadable just as the
    // user has to choose from one.
    it('grows the cut-out to cover an included element below the target', async () => {
        place('.a', 100)
        place('.list', 100, 40, 60)
        render(<TutorialSpotlight target=".a" include={['.list']} />)
        await waitFor(() => expect(mask()).not.toBeNull())

        // target spans 0-20, the list 40-100; padded by 8 on each side
        expect(mask()!.style.top).toBe('-8px')
        expect(mask()!.style.height).toBe('116px')
    })

    it('ignores an included element that is not on screen', async () => {
        place('.a', 100)
        render(<TutorialSpotlight target=".a" include={['.absent']} />)
        await waitFor(() => expect(mask()).not.toBeNull())
        expect(mask()!.style.height).toBe('36px')
    })

    // The regression: the mask used to unmount until the next animation frame had
    // measured the new target, un-dimming the whole page between every click and that
    // measurement — the page appeared to blink on every action.
    it('keeps the mask on screen while a new target is measured', async () => {
        place('.a', 100)
        place('.b', 400)
        const view = render(<TutorialSpotlight target=".a" />)
        await waitFor(() => expect(mask()).not.toBeNull())

        view.rerender(<TutorialSpotlight target=".b" />)

        // Synchronously after the switch, before any frame has run for `.b`.
        expect(mask()).not.toBeNull()
        await waitFor(() => expect(mask()!.style.left).toBe('392px'))
    })

    it('holds the last hole when the target stops being measurable', async () => {
        const element = place('.a', 100)
        render(<TutorialSpotlight target=".a" />)
        await waitFor(() => expect(mask()).not.toBeNull())

        element.remove()

        // Still dimmed: the caller signals "nothing to point at" with a null target,
        // and a vanished element must not flash the page bright in the meantime.
        await new Promise(resolve => setTimeout(resolve, 50))
        expect(mask()).not.toBeNull()
    })

    // The request editors open from a node's context menu, and nothing about a node
    // says it has one — so the step that needs a right-click says so.
    it('shows a right-click cue when the step asks for that gesture', async () => {
        place('.a', 100)
        render(<TutorialSpotlight target=".a" cue="right-click" />)
        await waitFor(() => expect(cue()).not.toBeNull())
        expect(cue()!.textContent).toContain('rightClick')
    })

    it('labels a double-click cue differently from a right-click one', async () => {
        place('.a', 100)
        const view = render(<TutorialSpotlight target=".a" cue="double-click" />)
        await waitFor(() => expect(cue()).not.toBeNull())
        expect(cue()!.textContent).toContain('doubleClick')
        expect(cue()!.textContent).not.toContain('rightClick')
        view.unmount()
    })

    it('marks the reference cue with its own icon and words', async () => {
        place('.a', 100)
        const view = render(<TutorialSpotlight target=".a" cue="reference" />)
        await waitFor(() => expect(cue()).not.toBeNull())
        expect(cue()!.textContent).toContain('reference')
        view.unmount()
    })

    // A JSON-tree row has no id of its own, so the only way to mean one row is its key.
    it('narrows the target to the element showing the given text', async () => {
        const email = place('.row', 100)
        email.textContent = 'email'
        const username = place('.row', 100, 40)
        username.textContent = 'username'

        render(<TutorialSpotlight target=".row" text="username" />)

        await waitFor(() => expect(mask()).not.toBeNull())
        expect(mask()!.style.top).toBe('32px')
    })

    it('shows no cue for a target you simply click', async () => {
        place('.a', 100)
        render(<TutorialSpotlight target=".a" />)
        await waitFor(() => expect(mask()).not.toBeNull())
        expect(cue()).toBeNull()
    })

    // It hangs over the node's own edge, outside the cut-out, so it has to paint above
    // the mask rather than rely on being inside the undimmed region.
    it('paints the cue above the mask', async () => {
        place('.a', 100)
        render(<TutorialSpotlight target=".a" cue="right-click" />)
        await waitFor(() => expect(cue()).not.toBeNull())
        expect(Number(cue()!.style.zIndex)).toBeGreaterThan(Number(mask()!.style.zIndex))
    })

    it('keeps the cue on screen for a target at the very top', async () => {
        const element = place('.a', 100)
        element.getBoundingClientRect = () => ({
            width: 20, height: 20, top: 0, left: 100, right: 120, bottom: 20, x: 100, y: 0, toJSON: () => ({}),
        })
        render(<TutorialSpotlight target=".a" cue="right-click" />)
        await waitFor(() => expect(cue()).not.toBeNull())
        expect(parseFloat(cue()!.style.top)).toBeGreaterThanOrEqual(0)
    })

    it('removes the mask once the target goes away entirely', async () => {
        place('.a', 100)
        const view = render(<TutorialSpotlight target=".a" />)
        await waitFor(() => expect(mask()).not.toBeNull())

        view.rerender(<TutorialSpotlight target={null} />)

        expect(mask()).toBeNull()
    })
})
