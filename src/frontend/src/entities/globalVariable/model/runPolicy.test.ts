import { describe, expect, it } from 'vitest'
import type { PickerItem } from './types'
import { findUsedMutableNames, resolveRunPolicy } from './runPolicy'

const mutable = (name: string, ...ownerIds: number[]): PickerItem => ({
    kind: 'MUTABLE', name, description: '', secret: false, valuePreview: null,
    ownerWorkflows: ownerIds.map((id) => ({ id, title: `wf ${id}` })), writable: false,
})

describe('findUsedMutableNames', () => {
    const items: PickerItem[] = [
        mutable('lastSync', 42),
        mutable('cursor', 7, 99),
        mutable('Counter'),
        { kind: 'CONSTANT', name: 'tenant', description: '', secret: false, valuePreview: null },
    ]

    it('takes owned and referenced mutable variables, ignoring case and other kinds', () => {
        expect(findUsedMutableNames(items, 42, ['counter', 'tenant'])).toEqual(['lastSync', 'Counter'])
    })

    it('returns nothing for a workflow that neither owns nor references a mutable variable', () => {
        expect(findUsedMutableNames(items, 100, ['tenant'])).toEqual([])
    })

    it('counts a workflow that is any one of several owners', () => {
        expect(findUsedMutableNames(items, 99, [])).toEqual(['cursor'])
    })
})

describe('resolveRunPolicy', () => {
    const queue = { id: 1, name: 'a', busyPolicy: 'QUEUE' as const }
    const refuse = { id: 2, name: 'b', busyPolicy: 'REFUSE' as const }

    it('has no policy without mutable variables', () => {
        expect(resolveRunPolicy([])).toBeNull()
    })

    it('queues when every variable queues', () => {
        expect(resolveRunPolicy([queue])).toEqual({ busyPolicy: 'QUEUE', causes: [queue] })
    })

    it('refuses as soon as one variable refuses, naming only the refusing ones', () => {
        expect(resolveRunPolicy([queue, refuse])).toEqual({ busyPolicy: 'REFUSE', causes: [refuse] })
    })
})
