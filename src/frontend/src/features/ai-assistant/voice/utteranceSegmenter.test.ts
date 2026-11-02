import { describe, expect, it } from 'vitest'
import { createUtteranceSegmenter } from './utteranceSegmenter'

// 1 kHz and 100 ms frames keep the arithmetic readable: one frame is 100 samples.
const RATE = 1000
const loud = () => new Float32Array(100).fill(0.1)
const quiet = () => new Float32Array(100)

function feed(segmenter: ReturnType<typeof createUtteranceSegmenter>, pattern: string) {
    const out: Float32Array[] = []
    for (const symbol of pattern) {
        const utterance = segmenter.push(symbol === 'x' ? loud() : quiet())
        if (utterance) out.push(utterance)
    }
    return out
}

describe('createUtteranceSegmenter', () => {
    it('cuts speech at the pause, with the lead-in and a short tail', () => {
        const segmenter = createUtteranceSegmenter({ sampleRate: RATE })
        const [utterance, ...rest] = feed(segmenter, '.....xxxxxxxx..........')
        expect(rest).toEqual([])
        // 3 frames of lead-in, 8 of speech, 2 of the closing pause.
        expect(utterance?.length).toBe(1300)
        expect(utterance?.[300]).toBeCloseTo(0.1)
    })

    it('drops speech too short to be a request', () => {
        expect(feed(createUtteranceSegmenter({ sampleRate: RATE }), '..xxx..........')).toEqual([])
    })

    it('keeps short pauses inside one utterance', () => {
        expect(feed(createUtteranceSegmenter({ sampleRate: RATE }), 'xxxx.....xxxx..........')).toHaveLength(1)
    })

    it('sends only the start of long talk, and skips the rest until a pause', () => {
        const segmenter = createUtteranceSegmenter({ sampleRate: RATE, maxMs: 2000 })
        const utterances = feed(segmenter, 'x'.repeat(50) + '.'.repeat(10) + 'xxxxxxx..........')
        expect(utterances.map(utterance => utterance.length)).toEqual([2000, 900])
    })

    it('says when it is hearing speech', () => {
        const segmenter = createUtteranceSegmenter({ sampleRate: RATE })
        feed(segmenter, '..x')
        expect(segmenter.isHearing()).toBe(true)
        feed(segmenter, 'x..........')
        expect(segmenter.isHearing()).toBe(false)
    })
})
