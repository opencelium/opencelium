import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useResumeAfterEntityCreated } from './useResumeAfterEntityCreated'
import type { OnboardingStatus, OnboardingStepId } from './types'

type Props = {
    count: number
    loaded: boolean
    status: OnboardingStatus
    stepId: OnboardingStepId
    resumeOnStep: OnboardingStepId
    onResume: () => void
}

const paused = (overrides: Partial<Props> = {}): Props => ({
    count: 0,
    loaded: true,
    status: 'paused',
    stepId: 'invoker',
    resumeOnStep: 'invoker',
    onResume: vi.fn(),
    ...overrides,
})

const render = (props: Props) =>
    renderHook((p: Props) => useResumeAfterEntityCreated(p), { initialProps: props })

describe('useResumeAfterEntityCreated', () => {
    it('resumes when the list grows while paused on the watched step', () => {
        const onResume = vi.fn()
        const { rerender } = render(paused({ onResume }))
        expect(onResume).not.toHaveBeenCalled()

        rerender(paused({ count: 1, onResume }))
        expect(onResume).toHaveBeenCalledTimes(1)
    })

    it('treats the first loaded value as a baseline, not as a creation', () => {
        const onResume = vi.fn()
        // The query resolves straight to a populated list on a reload.
        const { rerender } = render(paused({ count: 0, loaded: false, onResume }))
        rerender(paused({ count: 3, loaded: true, onResume }))
        expect(onResume).not.toHaveBeenCalled()
    })

    it('ignores growth while the tour is running, so an in-tour upload does not double-advance', () => {
        const onResume = vi.fn()
        const { rerender } = render(paused({ status: 'running', onResume }))
        rerender(paused({ count: 1, status: 'running', onResume }))
        expect(onResume).not.toHaveBeenCalled()
    })

    it('ignores growth while paused on a different step', () => {
        const onResume = vi.fn()
        const { rerender } = render(paused({ stepId: 'connector', onResume }))
        rerender(paused({ count: 1, stepId: 'connector', onResume }))
        expect(onResume).not.toHaveBeenCalled()
    })

    it('watches whichever step it was given', () => {
        const onResume = vi.fn()
        const props = { stepId: 'connector' as const, resumeOnStep: 'connector' as const, onResume }
        const { rerender } = render(paused(props))
        rerender(paused({ ...props, count: 1 }))
        expect(onResume).toHaveBeenCalledTimes(1)
    })

    it('ignores a shrinking list', () => {
        const onResume = vi.fn()
        const { rerender } = render(paused({ count: 2, onResume }))
        rerender(paused({ count: 1, onResume }))
        expect(onResume).not.toHaveBeenCalled()
    })

    it('resumes only once per creation, even as other props change identity', () => {
        const onResume = vi.fn()
        const { rerender } = render(paused({ onResume }))
        rerender(paused({ count: 1, onResume }))
        rerender(paused({ count: 1, onResume: vi.fn(), stepId: 'license' }))
        rerender(paused({ count: 1, onResume }))
        expect(onResume).toHaveBeenCalledTimes(1)
    })

    it('does nothing until the list has loaded', () => {
        const onResume = vi.fn()
        const { rerender } = render(paused({ loaded: false, onResume }))
        rerender(paused({ count: 5, loaded: false, onResume }))
        expect(onResume).not.toHaveBeenCalled()
    })
})
