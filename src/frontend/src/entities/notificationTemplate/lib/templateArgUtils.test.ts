import { describe, expect, it } from 'vitest'
import type { Aggregator } from '../model/types'
import { replaceAggregatorArgs, replaceInactiveArgs, toServerFormat } from './templateArgUtils'

const aggregator = (name: string, active = true): Aggregator =>
    ({ id: 1, name, active, script: '', args: [{ id: 7, name: 'x', description: '' }] })

describe('templateArgUtils with global variable references', () => {
    it('leaves {{global.x}} alone when converting to the server format', () => {
        expect(toServerFormat('{{report.x}} {{global.x}}', [aggregator('report'), aggregator('global')]))
            .toBe('{{7}} {{global.x}}')
    })

    it('never marks {{global.x}} as a missing aggregator argument', () => {
        expect(replaceInactiveArgs('{{global.x}}', [aggregator('global', false)])).toBe('{{global.x}}')
        expect(replaceAggregatorArgs('{{global.x}}', aggregator('global', false))).toBe('{{global.x}}')
    })
})
