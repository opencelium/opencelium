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

    it('points at "help workflow" only on the centred introduction', () => {
        expect(renderPill({ anchor: 'center' }).view.container.textContent).toContain('help workflow')
        expect(renderPill().view.container.textContent).not.toContain('help workflow')
    })

    it('prints a step snippet only when the step has one', () => {
        const { view } = renderPill({ example: 'RESULT_VAR = VAR_0 + " " + VAR_1' })
        expect(view.container.querySelector('code')!.textContent)
            .toBe('RESULT_VAR = VAR_0 + " " + VAR_1')
        expect(renderPill().view.container.querySelector('code')).toBeNull()
    })
})
