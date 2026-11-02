/**
 * The one place the assistant's name is defined. Renaming it means changing `name` and
 * replacing `heardAs` with how speech recognition writes the new one; the matcher, the
 * transcription hint and every UI text read it from here.
 */
export const WAKE_WORD = {
    name: 'Beebot',
    /** How whisper has written the name in English and German speech, letters only and lowercase. */
    heardAs: ['beebot', 'bebot', 'bibot', 'biebot', 'beabot', 'beebod', 'bebod', 'bbot', 'beebots'],
} as const

/** Words people put in front of a name ("hey Beebot", "okay Beebot", "hallo Beebot"). */
const LEAD_INS = new Set(['hey', 'hi', 'hallo', 'ok', 'okay', 'oh', 'na', 'ja', 'he'])
/** "bee bot", "b-bot": the name can arrive split over this many words. */
const MAX_NAME_WORDS = 3

export type WakeWordMatch = { isAddressed: false } | { isAddressed: true; request: string }

const lettersOf = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

function editDistance(left: string, right: string): number {
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
    for (let i = 1; i <= left.length; i += 1) {
        const current = [i]
        for (let j = 1; j <= right.length; j += 1) {
            current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1))
        }
        previous = current
    }
    return previous[right.length]
}

const own = lettersOf(WAKE_WORD.name)
const isName = (letters: string) =>
    (WAKE_WORD.heardAs as readonly string[]).includes(letters) || (letters.length >= 4 && editDistance(letters, own) <= 1)

/**
 * Whether an utterance is spoken to the assistant: it has to *start* with its name, at
 * most after a greeting. Everything after the name, without the comma or colon that
 * follows it, is the request; it is empty when only the name was said.
 */
export function matchWakeWord(transcript: string): WakeWordMatch {
    const words = transcript.trim().split(/\s+/).filter(word => lettersOf(word))
    const start = words.length > 1 && LEAD_INS.has(lettersOf(words[0])) ? 1 : 0
    for (let count = 1; count <= MAX_NAME_WORDS && start + count <= words.length; count += 1) {
        const letters = words.slice(start, start + count).map(lettersOf).join('')
        if (letters.length > own.length + 2) break
        if (isName(letters)) {
            const request = words.slice(start + count).join(' ').replace(/^[\s,:;.!?–-]+/, '').trim()
            return { isAddressed: true, request }
        }
    }
    return { isAddressed: false }
}
