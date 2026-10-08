import type { ReactNode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Provider-free stand-in; the real Button needs SystemProvider and contributes
// nothing to which actions the pill offers.
vi.mock('@shared/ui/primitives/Button', () => ({
    Button: ({ children, onClick, testId, color, variant }: {
        children?: ReactNode; onClick?: () => void; testId?: string; color?: string; variant?: string
    }) => <button data-testid={testId} data-color={color} data-variant={variant} onClick={onClick}>{children}</button>,
}))

vi.mock('@shared/ui/primitives/Icon', () => ({ Icon: ({ name }: { name: string }) => <i data-icon={name} /> }))

import { TutorialPill } from './TutorialPill'

const renderPill = (over: Partial<Parameters<typeof TutorialPill>[0]> = {}) => {
    const onClose = vi.fn()
    const view = render(
        <TutorialPill copy="customers" index={0} total={10} onClose={onClose} {...over} />,
    )
    return { view, onClose }
}

const exit = (view: ReturnType<typeof render>) =>
    view.container.querySelector<HTMLElement>('[data-testid="workflow-tutorial-exit"]')

describe('TutorialPill', () => {
    // Same keycaps as the introduction's command hint, so shortcuts look alike everywhere
    // the tutorial prints one.
    it('renders shortcuts as keycaps in the command-hint style', () => {
        const { view } = renderPill({ shortcuts: [
            { combos: [['mod', 'z']], labelKey: 'actions.undo' },
            { combos: [['mod', 'shift', 'z'], ['mod', 'y']], labelKey: 'actions.redo' },
        ] })
        const rows = view.container.querySelectorAll('.workflow-tutorial-pill__shortcuts .onboarding-command-note')
        expect(rows).toHaveLength(2)
        expect(rows[0].querySelectorAll('kbd')).toHaveLength(2)
        expect(Array.from(rows[1].querySelectorAll('kbd')).map(kbd => kbd.textContent).slice(-3))
            .toEqual(['Z', expect.any(String), 'Y'])
        expect(rows[1].querySelectorAll('kbd')).toHaveLength(5)
    })

    // The pill is mocked out of every other test in this feature, so this is the only
    // place that sees what it actually renders — a gap that once let the close icon be
    // removed without its replacement landing, leaving no way out mid-tutorial.
    it('offers a way out on an ordinary step', () => {
        const { view, onClose } = renderPill()
        expect(exit(view)).not.toBeNull()

        fireEvent.click(exit(view)!)

        expect(onClose).toHaveBeenCalledOnce()
    })

    it('offers it as a red action, on every step — leaving a sandbox reads as a destructive step', () => {
        expect(exit(renderPill().view)!.dataset.color).toBe('danger')
        expect(exit(renderPill({ index: 9, copy: 'summary' }).view)!.dataset.color).toBe('danger')
    })

    it('shows no Next button unless the step needs one', () => {
        const { view } = renderPill()
        expect(view.container.querySelector('[data-testid="workflow-tutorial-next"]')).toBeNull()
    })

    it('shows Next for a step the canvas cannot detect', () => {
        const onNext = vi.fn()
        const { view } = renderPill({ onNext })
        const next = view.container.querySelector<HTMLElement>('[data-testid="workflow-tutorial-next"]')

        fireEvent.click(next!)

        expect(onNext).toHaveBeenCalledOnce()
        // and Exit stays available alongside it
        expect(exit(view)).not.toBeNull()
    })

    it('takes the centre anchor only when told to, the corner otherwise', () => {
        const { view } = renderPill({ anchor: 'center' })
        expect(view.container.querySelector('aside')!.className).toContain('workflow-tutorial-pill--center')
        expect(renderPill().view.container.querySelector('aside')!.className)
            .not.toContain('workflow-tutorial-pill--center')
    })

    it('puts Exit on the left and Next on the right, only on the centred introduction', () => {
        const onNext = vi.fn()
        const centred = renderPill({ anchor: 'center', onNext }).view.container.querySelector('footer')!
        const order = Array.from(centred.children).map(el => el.getAttribute('data-testid'))
        expect(order[0]).toBe('workflow-tutorial-exit')
        expect(order[order.length - 1]).toBe('workflow-tutorial-next')

        // every other step keeps them stacked together on the right, Next before Exit
        const corner = renderPill({ onNext }).view.container.querySelector('footer')!
        const cornerOrder = Array.from(corner.children).map(el => el.getAttribute('data-testid'))
        expect(cornerOrder.indexOf('workflow-tutorial-next')).toBeLessThan(cornerOrder.indexOf('workflow-tutorial-exit'))
    })

    // The closing step is centred too, but has no Next — and a lone Exit thrown to the
    // left of the note reads as an afterthought rather than as one of two choices.
    it('keeps the ordinary footer for a centred step with nothing to go on to', () => {
        const footer = renderPill({ anchor: 'center', index: 9, copy: 'summary' })
            .view.container.querySelector('footer')!
        const order = Array.from(footer.children).map(el => el.getAttribute('data-testid'))
        expect(order[order.length - 1]).toBe('workflow-tutorial-exit')
    })

    it('points at "help workflow" only on the centred introduction', () => {
        expect(renderPill({ anchor: 'center' }).view.container.textContent).toContain('help workflow')
        expect(renderPill().view.container.textContent).not.toContain('help workflow')
        // not on the closing step, which is centred as well: it is read on the way out,
        // where how to get back in is not yet the question
        expect(renderPill({ anchor: 'center', index: 9, copy: 'summary' }).view.container.textContent)
            .not.toContain('help workflow')
    })

    it('numbers a step\'s picks, in the order given', () => {
        const { view } = renderPill({ picks: [{ label: 'getCustomers' }, { label: 'customers' }] })
        const items = Array.from(view.container.querySelectorAll('ol li')).map(li => li.textContent)

        expect(items).toEqual(['getCustomers', 'customers'])
        expect(renderPill().view.container.querySelector('ol')).toBeNull()
    })

    // A pick naming one of the editor's own options goes through the key the dropdown
    // itself renders, so the pill cannot spell it differently from the list. i18next
    // echoes the key when nothing is loaded, which is what this reads back — enough to
    // show the key was translated rather than printed as a literal or dropped.
    it('translates a pick given as a key, rather than printing it', () => {
        const { view } = renderPill({ picks: [{ labelKey: 'references.wholeArray' }] })
        expect(view.container.querySelector('ol li')!.textContent).toBe('references.wholeArray')
    })

    it('prints a step snippet only when the step has one', () => {
        const { view } = renderPill({ example: 'RESULT_VAR = VAR_0 + " " + VAR_1' })
        expect(view.container.querySelector('code')!.textContent)
            .toBe('RESULT_VAR = VAR_0 + " " + VAR_1')
        expect(renderPill().view.container.querySelector('code')).toBeNull()
    })

    describe('dragging', () => {
        // jsdom has no pointer capture; the hook only needs the calls to exist.
        HTMLElement.prototype.setPointerCapture = vi.fn()
        HTMLElement.prototype.releasePointerCapture = vi.fn()
        HTMLElement.prototype.hasPointerCapture = vi.fn(() => true)

        const pill = (view: ReturnType<typeof render>) =>
            view.container.querySelector<HTMLElement>('.workflow-tutorial-pill')!
        const handle = (view: ReturnType<typeof render>) =>
            view.container.querySelector<HTMLElement>('[data-testid="workflow-tutorial-drag-handle"]')!
        const drag = (view: ReturnType<typeof render>, to: { x: number; y: number }) => {
            fireEvent.pointerDown(handle(view), { button: 0, clientX: 0, clientY: 0, pointerId: 1 })
            fireEvent.pointerMove(handle(view), { clientX: to.x, clientY: to.y, pointerId: 1 })
            fireEvent.pointerUp(handle(view), { pointerId: 1 })
        }

        it('moves a corner-docked step to where it is dropped', () => {
            const { view } = renderPill({ index: 3 })
            drag(view, { x: 120, y: 90 })
            expect(pill(view).style.left).toBe('120px')
            expect(pill(view).style.top).toBe('90px')
        })

        it('shows a grip only on steps that can be moved', () => {
            const grip = '[data-icon="drag-handle"]'
            expect(renderPill({ index: 3 }).view.container.querySelector(grip)).not.toBeNull()
            expect(renderPill({ anchor: 'center' }).view.container.querySelector(grip)).toBeNull()
        })

        it('keeps the centred book-ends fixed', () => {
            const { view } = renderPill({ anchor: 'center' })
            drag(view, { x: 120, y: 90 })
            expect(pill(view).style.left).toBe('')
            expect(pill(view).className).not.toContain('workflow-tutorial-pill--movable')
        })

        it('returns to its corner when the next step docks elsewhere', () => {
            const { view } = renderPill({ index: 3 })
            drag(view, { x: 120, y: 90 })
            view.rerender(<TutorialPill copy="customers" index={4} total={10} onClose={vi.fn()} />)
            expect(pill(view).style.left).toBe('120px')
            view.rerender(<TutorialPill copy="customers" anchor="top-right" index={5} total={10} onClose={vi.fn()} />)
            expect(pill(view).style.left).toBe('')
        })
    })
})
