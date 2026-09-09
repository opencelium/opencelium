import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

// Provider-free stand-ins: the real primitives need SystemProvider, and none of them
// take part in where focus lands. The antd Select stays real — it is what carries it.
vi.mock('@shared/ui/primitives/Tooltip', () => ({
    Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
}))
vi.mock('@shared/ui/actions/CopyButton', () => ({ CopyButton: () => null }))
vi.mock('../MethodConnectorChip/MethodConnectorChip', () => ({ MethodConnectorChip: () => null }))
vi.mock('../../../MethodColorDot/MethodColorDot', () => ({ MethodColorDot: () => null }))

import { MethodType } from '@features/workflow/types/connectionMethod.types'
import type { MethodWithId } from '@features/workflow/types/connection'
import { ReferenceMethodSelect } from './ReferenceMethodSelect'

const methods = [{
    id: 'm1', name: 'getCustomers', label: 'getCustomers', color: '#a1b2c3',
    methodType: MethodType.HttpRequest,
}] as unknown as MethodWithId[]

const renderSelect = (autoFocus?: boolean) => render(
    <ReferenceMethodSelect methods={methods} methodId={undefined}
        duplicateIndexByColor={new Map()} onChange={vi.fn()} autoFocus={autoFocus} />,
)

const focusIsInSelect = () =>
    !!document.activeElement?.closest('[data-testid="workflow-reference-method-select"]')

/** The dropdown is portalled to the body, so it is not inside the render container. */
const listIsOpen = () => !!document.querySelector('.ant-select-dropdown')

describe('ReferenceMethodSelect', () => {
    beforeAll(() => {
        // antd measures the open dropdown; jsdom has no ResizeObserver at all.
        globalThis.ResizeObserver ??= class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver
    })

    // The endpoint editor reveals the reference generator on a button click, so the
    // caret should land in the first thing to fill in rather than leaving the user to
    // hunt for it.
    it('takes focus when the generator is opened by a click', () => {
        renderSelect(true)
        expect(focusIsInSelect()).toBe(true)
    })

    // Focus alone is invisible on a combobox — the open list is what the user can see.
    it('opens its list so the section reads as ready, not merely focused', () => {
        renderSelect(true)
        expect(listIsOpen()).toBe(true)
        expect(document.body.textContent).toContain('getCustomers')
    })

    // The body editor renders generators inline, several at a time; any of them
    // grabbing focus on mount would fight the others and move the caret unasked.
    it('leaves focus and the list alone by default', () => {
        renderSelect()
        expect(focusIsInSelect()).toBe(false)
        expect(listIsOpen()).toBe(false)
    })
})
