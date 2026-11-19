import { describe, expect, it } from 'vitest'
import { togglePermission, toPermissionsDto } from './sharing'

describe('sharing grants', () => {
    it('adds VIEW_USE with EDIT or DELETE', () => {
        expect(togglePermission([], 'EDIT', true)).toEqual(['VIEW_USE', 'EDIT'])
        expect(togglePermission(['VIEW_USE'], 'DELETE', true)).toEqual(['VIEW_USE', 'DELETE'])
    })

    it('drops EDIT and DELETE when VIEW_USE goes', () => {
        expect(togglePermission(['VIEW_USE', 'EDIT', 'DELETE'], 'VIEW_USE', false)).toEqual([])
        expect(togglePermission(['VIEW_USE', 'EDIT'], 'EDIT', false)).toEqual(['VIEW_USE'])
    })

    it('leaves users without any right out of the request', () => {
        expect(toPermissionsDto([
            { userId: 5, name: 'a', permissions: ['VIEW_USE'] },
            { userId: 6, name: 'b', permissions: [] },
        ], 3)).toEqual({ grants: [{ userId: 5, permissions: ['VIEW_USE'] }], version: 3 })
    })
})
