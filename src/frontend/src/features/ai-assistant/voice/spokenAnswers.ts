/** Short spoken answers Beebot understands without the AI, in English and German. Pure, so they are easy to test. */

const wordsOf = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').split(/\s+/).filter(Boolean)

const YES = new Set([
    'yes', 'yeah', 'yep', 'yup', 'ok', 'okay', 'sure', 'confirm', 'confirmed', 'proceed', 'absolutely', 'definitely',
    'ja', 'jawohl', 'jep', 'jo', 'genau', 'klar', 'gerne', 'bestätigen', 'bestätige', 'bestätigt', 'einverstanden',
    'delete', 'remove', 'löschen', 'lösche', 'entfernen', 'entferne',
])
const NO = new Set([
    'no', 'nope', 'nah', 'cancel', 'abort', 'keep', 'don\'t', 'dont',
    'nein', 'nö', 'nee', 'abbrechen', 'abbruch', 'behalten', 'behalte', 'nicht',
])
const YES_PHRASE_RE = /^(go ahead|do it|mach (es|das)|tu es|los geht'?s)\b/
/** An answer is a few words; a longer utterance is a new request, not a reply. */
const MAX_ANSWER_WORDS = 4

export type ConfirmAnswer = 'yes' | 'no' | null

/**
 * Reads a spoken reply to an open confirmation, removals included: "yes", "confirm", "delete" confirm; "no", "cancel"
 * decline. A reply with both ("no, don't delete") declines, so a mixed answer never removes anything.
 */
export function readConfirmAnswer(text: string): ConfirmAnswer {
    const words = wordsOf(text)
    if (words.length === 0 || words.length > MAX_ANSWER_WORDS) return null
    if (words.some(word => NO.has(word))) return 'no'
    if (words.some(word => YES.has(word)) || YES_PHRASE_RE.test(words.join(' '))) return 'yes'
    return null
}

const STOP_LISTENING_RE = /^(stop|quit|end) (listening|it all)|^(hör|höre) auf (zuzuhören|zu hören)|^geh schlafen|^go to sleep/i
// The whole request, at most with a filler: "stop the test" is a request for the test run, not for Beebot to stop.
const STOP_RE = /^(stop|stopp|halt|cancel|abbrechen|enough|genug|ruhe|be quiet|quiet|sei still|never ?mind|vergiss es)( (it|now|please|that|bitte|jetzt|das))?$/i

export type StopRequest = 'stop' | 'stop-listening' | null

/** "Stop" ends what Beebot is saying and doing; "stop listening" also turns it off. */
export function readStopRequest(text: string): StopRequest {
    const said = text.trim().replace(/[.!?,]+$/g, '')
    if (STOP_LISTENING_RE.test(said)) return 'stop-listening'
    if (STOP_RE.test(wordsOf(said).join(' '))) return 'stop'
    return null
}

const CAPABILITIES_RE = /\b(what can you do|what do you do|what can i (say|ask)|how can you help|was kannst du|was kann ich (sagen|fragen)|wobei (kannst du|hilfst du)|wie kannst du helfen)\b/i

/** "What can you do?" is answered from a fixed list, not the AI: it must always work, and quickly. */
export const isCapabilitiesQuestion = (text: string): boolean => CAPABILITIES_RE.test(text)

// "Add X and then map it from Y": explicit sequencing words only; a plain "and" joins parts of one request.
const THEN_RE = /\s*,?\s*\b(?:and then|then|und dann|danach|anschließend)\b,?\s*/giu
/** A part shorter than this is not a request of its own ("…, then go"), so the whole is kept. */
const MIN_PART_WORDS = 2

/** Splits "do A and then B" into the requests to run one after the other; one request comes back as it is. */
export function splitRequests(text: string): string[] {
    const parts = text.split(THEN_RE).map(part => part.trim()).filter(Boolean)
    return parts.length > 1 && parts.every(part => wordsOf(part).length >= MIN_PART_WORDS) ? parts : [text.trim()]
}
