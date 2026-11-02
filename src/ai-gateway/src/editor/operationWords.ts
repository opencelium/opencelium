import { normalize } from '../guide/spokenNames.ts'

/**
 * German words (and English synonyms) for what API operations are named after, mapped to the English words in their
 * names. Short on purpose: it only has to bridge "Löschen eines Objekts" to cmdb.object.delete, not translate.
 */
const GLOSSARY: Record<string, string> = {
    objekt: 'object', objekte: 'object', objekts: 'object', objekten: 'object',
    kategorie: 'category', kategorien: 'category', dienst: 'service', dienste: 'service',
    benutzer: 'user', nutzer: 'user', kunde: 'customer', kunden: 'customer', vorgang: 'issue', kommentar: 'comment',
    verknüpfung: 'link', löschen: 'delete', entfernen: 'delete', remove: 'delete',
    lesen: 'read', holen: 'get', abrufen: 'get', fetch: 'get', retrieve: 'get', load: 'get',
    anlegen: 'create', erstellen: 'create', make: 'create',
    ändern: 'update', aktualisieren: 'update', bearbeiten: 'update', change: 'update', edit: 'update', modify: 'update',
    suchen: 'search', find: 'search', alle: 'all', every: 'all',
    // Field names, for "Transformation für die Seriennummer".
    nummer: 'number', seriennummer: 'serialnumber', hersteller: 'vendor', anbieter: 'vendor', zustand: 'state',
    klasse: 'class', titel: 'title', beschreibung: 'description', preis: 'price', anmeldung: 'login', benutzername: 'username',
}

/** "objects" and "reads" are the same word as "object" and "read" here. */
const stem = (word: string) => (word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word)

/** The words a spoken description or an operation name consists of: "cmdb.object.delete", "getAllUsers", "Löschen eines Objekts". */
export function wordsOf(text: string): string[] {
    return text
        .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
        .split(/[^\p{L}\p{N}]+/u)
        .map((word) => normalize(word))
        .filter((word) => word.length >= 3)
        .map((word) => stem(GLOSSARY[word] ?? word))
}

const isSameWord = (left: string, right: string) =>
    left === right || (Math.min(left.length, right.length) >= 4 && (left.startsWith(right) || right.startsWith(left)))

/** How many of the operation's words the description says. */
export const sharedWords = (description: string, operation: string) => {
    const said = wordsOf(description)
    return wordsOf(operation).filter((word) => said.some((other) => isSameWord(word, other))).length
}

/** The one operation the description fits best by its words (two or more of them), or empty when that is not clear. */
export function bestByWords(description: string, operations: string[]): string {
    const scored = operations.map((operation) => ({ operation, score: sharedWords(description, operation) }))
        .sort((left, right) => right.score - left.score)
    const [first, second] = scored
    return first && first.score >= 2 && (!second || second.score < first.score) ? first.operation : ''
}

/**
 * The request without the words describing the new method, so its words cannot be read as the step it goes next to.
 * Each described word takes out only its first occurrence: in "add config item update after config item get" the
 * step's own "config item" stays.
 */
export function withoutWords(text: string, description: string): string {
    const pending = wordsOf(description)
    return text.split(/\s+/).filter((word) => {
        const [own] = wordsOf(word)
        const index = own ? pending.findIndex((other) => isSameWord(own, other)) : -1
        if (index === -1) return true
        pending.splice(index, 1)
        return false
    }).join(' ')
}
