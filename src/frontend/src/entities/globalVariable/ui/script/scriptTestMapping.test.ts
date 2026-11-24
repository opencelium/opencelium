import { describe, expect, it } from 'vitest'
import { toTestArguments } from './scriptTestMapping'

const parameters = [
    { name: 'a', required: true, default: null },
    { name: 'b', required: false, default: 'low' },
    { name: 'c', required: false, default: null },
]

describe('test arguments', () => {
    it('sends the arguments in parameter order', () => {
        expect(toTestArguments({ a: { mode: 'json', text: '1' }, b: { mode: 'text', text: 'x' } }, parameters))
            .toEqual({ values: [1, 'x'], invalid: [] })
    })

    it('fills a gap with the default and leaves trailing missing ones out', () => {
        expect(toTestArguments({ a: { mode: 'json', text: '1' }, c: { mode: 'json', text: 'true' } }, parameters).values)
            .toEqual([1, 'low', true])
        expect(toTestArguments({}, parameters).values).toEqual([])
    })

    it('reports input that is not JSON', () => {
        expect(toTestArguments({ a: { mode: 'json', text: '{' } }, parameters).invalid).toEqual(['a'])
    })
})
