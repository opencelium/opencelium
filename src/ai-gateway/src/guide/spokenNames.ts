/** Spoken names arrive as "get customers", typed ones as "getCustomers": compare letters and digits only. */
export const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

function editDistance(left: string, right: string): number {
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
    for (let i = 1; i <= left.length; i += 1) {
        const current = [i]
        for (let j = 1; j <= right.length; j += 1) {
            current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + (left[i - 1] === right[j - 1] ? 0 : 1))
        }
        previous = current
    }
    return previous[right.length]!
}

/** Runs of 1-4 consecutive words, joined: "config item get" is one name spoken as three words. */
function wordRuns(prompt: string): string[] {
    const words = prompt.split(/[^\p{L}\p{N}]+/u).map(normalize).filter(Boolean)
    return words.flatMap((_, start) => [1, 2, 3, 4].flatMap((count) =>
        start + count <= words.length ? [words.slice(start, start + count).join('')] : []))
}

/**
 * A method the request spells out, transcribed or typed, without asking the model. Speech
 * recognition slips a letter in a long name ("ConfigItemGit"), so a run of words within one
 * edit per six letters counts too. The closest wins, then the longest, so "getCustomersById"
 * is not cut short to "getCustomers".
 */
export function findSpokenMethod(prompt: string, methods: string[]): string {
    const runs = wordRuns(prompt)
    const said = normalize(prompt)
    const scored = methods.flatMap((method) => {
        const name = normalize(method)
        if (name.length < 3) return []
        if (said.includes(name)) return [{ method, distance: 0, length: name.length }]
        const allowed = Math.floor(name.length / 6)
        if (!allowed) return []
        const distance = Math.min(...runs.filter((run) => Math.abs(run.length - name.length) <= allowed).map((run) => editDistance(run, name)))
        return distance <= allowed ? [{ method, distance, length: name.length }] : []
    })
    return scored.sort((left, right) => left.distance - right.distance || right.length - left.length)[0]?.method ?? ''
}

/**
 * The model's pick counts only when the request actually refers to it: a word of the request (4+ letters) inside the
 * method's name. A constrained answer has to name *something*, and a request that names no method must stay empty
 * so the frontend falls back to the selected method.
 */
export function isReferredTo(method: string, prompt: string): boolean {
    const name = normalize(method)
    return prompt.split(/[^\p{L}\p{N}]+/u).map(normalize).some((word) => word.length >= 4 && name.includes(word))
}
