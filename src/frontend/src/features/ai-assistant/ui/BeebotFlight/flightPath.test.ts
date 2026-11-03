import { describe, expect, it } from 'vitest'
import { bankToward, flightDuration, perchOn } from './flightPath'

describe('flightPath', () => {
    it('scales the flight with the distance, between 550 and 950 ms', () => {
        expect(flightDuration(0)).toBe(550)
        expect(flightDuration(500)).toBe(670)
        expect(flightDuration(5000)).toBe(950)
    })

    it('banks toward the destination', () => {
        expect(bankToward({ x: 0, y: 0 }, { x: 100, y: 50 })).toBe(14)
        expect(bankToward({ x: 100, y: 0 }, { x: 0, y: 0 })).toBe(-14)
        expect(bankToward({ x: 10, y: 0 }, { x: 10, y: 80 })).toBe(0)
    })

    it('perches on the top-right corner, kept inside the viewport', () => {
        const viewport = { width: 1000, height: 800 }
        expect(perchOn({ left: 100, top: 200, right: 300, bottom: 260 }, viewport)).toEqual({ x: 300, y: 200 })
        expect(perchOn({ left: 900, top: -40, right: 1200, bottom: 20 }, viewport)).toEqual({ x: 984, y: 16 })
    })
})
