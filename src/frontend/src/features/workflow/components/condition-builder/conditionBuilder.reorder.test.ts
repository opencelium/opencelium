import { describe, expect, it } from 'vitest'
import type { ConditionChild, ConditionGroup } from './conditionBuilder.types'
import { moveConditionChild } from './conditionBuilder.utils'

const tree: ConditionGroup = {
    id: 'root',
    type: 'group',
    items: [
        { id: 'a', type: 'rule' },
        { id: 'b', type: 'rule' },
        { id: 'g', type: 'group', items: [{ id: 'c', type: 'rule' }, { id: 'h', type: 'group', items: [] }] },
    ],
}

const shape = (group: ConditionGroup): unknown[] => (group.items || []).map((child: ConditionChild) =>
    child.type === 'group' ? { [child.id]: shape(child) } : child.id)

describe('moveConditionChild', () => {
    it('reorders siblings', () => {
        expect(shape(moveConditionChild(tree, 'a', { id: 'b', placement: 'after' })))
            .toEqual(['b', 'a', { g: ['c', { h: [] }] }])
    })

    it('moves a rule next to a rule of another group', () => {
        expect(shape(moveConditionChild(tree, 'a', { id: 'c', placement: 'before' })))
            .toEqual(['b', { g: ['a', 'c', { h: [] }] }])
    })

    it('moves a rule out of a nested group', () => {
        expect(shape(moveConditionChild(tree, 'c', { id: 'a', placement: 'before' })))
            .toEqual(['c', 'a', 'b', { g: [{ h: [] }] }])
    })

    it('appends into an empty group', () => {
        expect(shape(moveConditionChild(tree, 'b', { id: 'h', placement: 'inside' })))
            .toEqual(['a', { g: ['c', { h: ['b'] }] }])
    })

    it('refuses to drop a group into itself or its descendants', () => {
        expect(moveConditionChild(tree, 'g', { id: 'h', placement: 'inside' })).toBe(tree)
        expect(moveConditionChild(tree, 'g', { id: 'c', placement: 'after' })).toBe(tree)
    })
})
