import { describe, expect, it } from 'vitest'
import type { PickerItem } from './types'
import { findUsedMutableNames, resolveRunPolicy } from './runPolicy'

const mutable = (name: string, ownerId: number | null): PickerItem => ({
    kind: 'MUTABLE', name, description: '', secret: false, valuePreview: null,
    ownerWorkflow: ownerId === null ? null : { id: ownerId, title: `wf ${ownerId}` }, writable: false,
})

describe('findUsedMutableNames', () => {
    const items: PickerItem[] = [
        mutable('lastSync', 42),
        mutable('cursor', 7),
        mutable('Counter', null),
        { kind: 'CONSTANT', name: 'tenant', description: '', secret: false, valuePreview: null },
    ]

    it('takes owned and referenced mutable variables, ignoring case and other kinds', () => {
        expect(findUsedMutableNames(items, 42, ['counter', 'tenant'])).toEqual(['lastSync', 'Counter'])
    })

    it('returns nothing for a workflow that neither owns nor references a mutable variable', () => {
        expect(findUsedMutableNames(items, 99, ['tenant'])).toEqual([])
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
