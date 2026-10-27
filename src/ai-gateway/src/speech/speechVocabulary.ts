// Whisper keeps only the last ~224 tokens of a prompt, so the names that matter most go last and the list stays short.
const MAX_PROMPT_CHARS = 700
const PALETTE_WORDS = 'OpenCelium, workflow, schedule, connector, invoker, template, Zeitplan, Konnektor, Vorlage'

/** "CheckMK 2", "WhatsUp 2024" and "SnipeIT7" are one name to the listener. */
const spokenName = (name: string) => name.replace(/[\s_-]*\d+$/, '').trim()

/**
 * The initial prompt for transcription: system names a listener can't guess ("i-doit" is otherwise heard as "E-Deut")
 * and the palette's own words, in English and German.
 */
export function buildSpeechPrompt(systemNames: string[]): string {
    const names = [...new Set(systemNames.map(spokenName).filter((name) => name.length > 1))]
    let list = ''
    for (const name of names) {
        const next = list ? `${list}, ${name}` : name
        if (next.length + PALETTE_WORDS.length + 20 > MAX_PROMPT_CHARS) break
        list = next
    }
    return `${PALETTE_WORDS}. Systems: ${list}.`
}

// "admin at opencelium.io": Whisper writes the dot of a spoken address but keeps "at" (German "ät") as a word.
const SPOKEN_EMAIL_RE = /\b([\p{L}\p{N}._%+-]+) (?:at|ät) ([\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,})\b/giu

/** Whisper's text for a short command: no surrounding blanks, no closing full stop, spoken e-mail addresses written out. */
export function cleanTranscript(text: string): string {
    const trimmed = text.replace(/\s+/g, ' ').trim()
    if (/^[[(].*[\])]$/.test(trimmed)) return ''
    return trimmed.replace(/[.。!]+$/, '').replace(SPOKEN_EMAIL_RE, '$1@$2').trim()
}
