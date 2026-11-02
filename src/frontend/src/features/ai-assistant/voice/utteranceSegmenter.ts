export type SegmenterOptions = {
    sampleRate: number
    /** RMS above this counts as speech — the same threshold the palette's recorder uses. */
    speechLevel?: number
    /** Shorter speech (a cough, a click, "hm") is dropped instead of transcribed. */
    minSpeechMs?: number
    /** A pause this long ends the utterance. */
    silenceMs?: number
    /** Audio kept from before speech was detected, so the first syllable of the name is not cut. */
    preRollMs?: number
    /** Only the start is transcribed: the name comes first, and long talk is rarely meant for the assistant. */
    maxMs?: number
}

export type UtteranceSegmenter = {
    /** Feeds one frame of mono samples; returns a finished utterance, or null while none is ready. */
    push: (frame: Float32Array) => Float32Array | null
    /** True while speech is being collected, for the "I hear you" indicator. */
    isHearing: () => boolean
    reset: () => void
}

const rms = (frame: Float32Array) => Math.sqrt(frame.reduce((sum, sample) => sum + sample * sample, 0) / Math.max(1, frame.length))

const concat = (chunks: Float32Array[]) => {
    const out = new Float32Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
    let offset = 0
    for (const chunk of chunks) {
        out.set(chunk, offset)
        offset += chunk.length
    }
    return out
}

/** Cuts a continuous microphone signal into utterances by loudness: speech, then a pause. */
export function createUtteranceSegmenter({
    sampleRate, speechLevel = 0.02, minSpeechMs = 600, silenceMs = 1000, preRollMs = 300, maxMs = 8000,
}: SegmenterOptions): UtteranceSegmenter {
    const samples = (ms: number) => Math.round((ms / 1000) * sampleRate)
    const [minSpeech, silenceLimit, preRollLimit, maxLength] = [samples(minSpeechMs), samples(silenceMs), samples(preRollMs), samples(maxMs)]
    // `overflow`: the utterance hit maxMs and was sent; the rest of it is skipped until the speaker pauses.
    let state: 'idle' | 'speech' | 'overflow' = 'idle'
    let chunks: Float32Array[] = []
    let length = 0
    let speech = 0
    let silence = 0

    const reset = () => {
        state = 'idle'
        chunks = []
        length = 0
        speech = 0
        silence = 0
    }

    const finish = (next: 'idle' | 'overflow') => {
        const isLongEnough = speech >= minSpeech
        // Most of the closing pause is silence whisper does not need.
        const keep = state === 'speech' && next === 'idle' ? Math.max(0, length - silence + samples(200)) : length
        const utterance = isLongEnough ? concat(chunks).subarray(0, keep) : null
        reset()
        state = next
        return utterance
    }

    const push = (frame: Float32Array): Float32Array | null => {
        const isSpeech = rms(frame) > speechLevel
        switch (state) {
            case 'idle': {
                chunks.push(frame)
                length += frame.length
                if (isSpeech) {
                    state = 'speech'
                    speech = frame.length
                    return null
                }
                while (chunks.length > 1 && length - chunks[0].length >= preRollLimit) length -= chunks.shift()!.length
                return null
            }
            case 'speech': {
                chunks.push(frame)
                length += frame.length
                if (isSpeech) {
                    speech += frame.length
                    silence = 0
                } else {
                    silence += frame.length
                }
                if (silence >= silenceLimit) return finish('idle')
                if (length >= maxLength) return finish('overflow')
                return null
            }
            case 'overflow': {
                silence = isSpeech ? 0 : silence + frame.length
                if (silence >= silenceLimit) reset()
                return null
            }
            default: {
                const _exhaustive: never = state
                return _exhaustive
            }
        }
    }

    return { push, isHearing: () => state === 'speech', reset }
}
