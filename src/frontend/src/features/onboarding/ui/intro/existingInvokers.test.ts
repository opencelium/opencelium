import { describe, expect, it } from 'vitest'
import { visibleCount } from './existingInvokers.utils'

describe('invoker list progressive reveal', () => {
    it('starts at three', () => {
        expect(visibleCount(0)).toBe(3)
    })

    it('reveals a doubling batch on each click', () => {
        const totals = [0, 1, 2, 3, 4].map(visibleCount)
        expect(totals).toEqual([3, 8, 18, 38, 78])
        // the batch itself doubles: 5, 10, 20, 40
        expect(totals.slice(1).map((total, i) => total - totals[i])).toEqual([5, 10, 20, 40])
    })
})
