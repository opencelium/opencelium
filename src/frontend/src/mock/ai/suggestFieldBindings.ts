import type {
    FieldBindingSuggestion,
    FieldBindingSuggestionRequest,
    SchemaField,
    SuggestionOrigin,
} from '@features/workflow/ai/fieldBindingSuggestion.types'

/**
 * Stand-in for the backend's suggester while the API does not exist yet. It implements the
 * two tiers that need no model — a hardcoded precedent table and name/type matching — and
 * fakes the third with a synonym list, so the UI is exercised against plausible, data-driven
 * output instead of a fixed fixture. The scoring here is also the spec the real backend has
 * to reproduce, which is why it lives in its own tested module rather than inside the handler.
 */

/** Groups of names that mean the same field. First entry is the canonical form. */
const SYNONYM_GROUPS = [
    ['email', 'mail', 'emailaddress', 'mailaddress'],
    ['phone', 'tel', 'telephone', 'mobile', 'telefon'],
    ['name', 'title', 'label', 'bezeichnung'],
    ['id', 'identifier', 'key', 'nummer', 'no'],
    ['description', 'desc', 'details', 'beschreibung'],
    ['summary', 'subject', 'headline', 'betreff'],
    ['created', 'createdat', 'creationdate', 'erstelltam'],
    ['updated', 'updatedat', 'modified', 'modifiedat', 'geaendertam'],
    ['status', 'state', 'zustand'],
    ['priority', 'severity', 'prio', 'prioritaet'],
    ['customer', 'client', 'account', 'kunde'],
    ['firstname', 'givenname', 'forename', 'vorname'],
    ['lastname', 'surname', 'familyname', 'nachname'],
    ['city', 'town', 'ort', 'stadt'],
    ['zip', 'zipcode', 'postcode', 'postalcode', 'plz'],
    ['street', 'strasse', 'addressline'],
    ['amount', 'total', 'sum', 'betrag'],
    ['quantity', 'qty', 'count', 'menge'],
]

const CANONICAL_BY_WORD = new Map<string, string>(
    SYNONYM_GROUPS.flatMap((group) => group.map((word) => [word, group[0]] as const)),
)

/**
 * Pairs this connector combination has been mapped as before, keyed canonical-target ->
 * canonical-source. On the real backend this tier is a query over saved field bindings;
 * here it is a fixture, present so the UI has something to render for the precedent origin.
 */
const PRECEDENT_PAIRS = new Map<string, string>([
    ['summary', 'name'],
    ['description', 'summary'],
    ['priority', 'status'],
])

const unquoteSegment = (segment: string) =>
    segment.match(/^\['(.*)']$/)?.[1] ?? segment.match(/^\["(.*)"]$/)?.[1] ?? segment

// Same segment grammar the reference pickers use. Splitting on '.' instead would cut
// a quoted key in half — "$.['@odata.id']" would end at "id']" and then match any
// field called `id`, which is a different field entirely.
const PATH_SEGMENT_RE = /\['(?:\\'|[^'])*']|\["(?:\\"|[^"])*"]|\[[^\]]+]|[^.[\]]+/g

const isSubscript = (segment: string) => /^\[[^'"].*]$/.test(segment)

/** The field's own name: the last *named* segment, skipping back over array subscripts. */
export const lastSegment = (path: string) => {
    const segments = String(path ?? '').replace(/^\$\.?/, '').match(PATH_SEGMENT_RE) ?? []
    for (let index = segments.length - 1; index >= 0; index -= 1) {
        if (!isSubscript(segments[index])) return unquoteSegment(segments[index])
    }
    return ''
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const tokenize = (value: string) =>
    value
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map((token) => token.toLowerCase())

/**
 * The whole name is resolved before its parts, so `lastName` and `nachname` both land on
 * `lastname` — splitting first would leave the English one as ['last', 'name'] and the two
 * would never meet.
 */
const canonicalize = (value: string) => {
    const whole = CANONICAL_BY_WORD.get(normalize(value))
    if (whole) return [whole]
    return tokenize(value).map((token) => CANONICAL_BY_WORD.get(token) ?? token)
}

const jaccard = (left: string[], right: string[]) => {
    const a = new Set(left)
    const b = new Set(right)
    const shared = [...a].filter((token) => b.has(token)).length
    const union = new Set([...a, ...b]).size
    return union === 0 ? 0 : shared / union
}

type Match = { confidence: number; origin: SuggestionOrigin; rationale?: string }

/** Both kinds known and different — a real mapping may still be right, but it needs a transform. */
const isKindMismatch = (target: SchemaField, source: SchemaField) =>
    target.kind !== 'unknown' && source.kind !== 'unknown' && target.kind !== source.kind

const scorePair = (target: SchemaField, source: SchemaField): Match | null => {
    const targetName = lastSegment(target.path)
    const sourceName = lastSegment(source.path)
    if (!targetName || !sourceName) return null

    const targetKey = normalize(targetName)
    const sourceKey = normalize(sourceName)
    if (!targetKey || !sourceKey) return null

    const base = ((): Match | null => {
        if (targetKey === sourceKey) {
            const wholePath = normalize(target.path) === normalize(source.path)
            return { confidence: wholePath ? 0.99 : 0.94, origin: 'deterministic' }
        }
        const targetTokens = canonicalize(targetName)
        const sourceTokens = canonicalize(sourceName)
        if (PRECEDENT_PAIRS.get(targetTokens.join('')) === sourceTokens.join('')) {
            return { confidence: 0.9, origin: 'precedent' }
        }
        if (targetTokens.join('|') === sourceTokens.join('|')) {
            return {
                confidence: 0.78,
                origin: 'model',
                rationale: `"${sourceName}" and "${targetName}" are the same field under different names.`,
            }
        }
        const overlap = jaccard(targetTokens, sourceTokens)
        if (overlap >= 0.5) {
            return {
                confidence: 0.45 + overlap * 0.25,
                origin: 'model',
                rationale: `"${sourceName}" and "${targetName}" share most of their name.`,
            }
        }
        return null
    })()

    if (!base) return null
    if (!isKindMismatch(target, source)) return base
    return {
        ...base,
        confidence: base.confidence * 0.8,
        rationale: `${base.rationale ? `${base.rationale} ` : ''}Types differ (${source.kind} to ${target.kind}) — this binding likely needs an enhancement script.`,
    }
}

/**
 * Greedy global assignment: every candidate pair is scored, then taken best-first, so one
 * target leaf ends up with at most one source. Two target fields competing for the same
 * source is allowed — fanning one response value into several request fields is ordinary.
 */
export const suggestFieldBindings = (
    request: FieldBindingSuggestionRequest,
): FieldBindingSuggestion[] => {
    const candidates = request.sources.flatMap((source) =>
        source.fields.flatMap((sourceField) =>
            request.target.fields.flatMap((targetField) => {
                const match = scorePair(targetField, sourceField)
                return match
                    ? [{
                          id: `${source.color}:${sourceField.path}->${targetField.path}`,
                          targetPath: targetField.path,
                          sourceColor: source.color,
                          sourcePath: sourceField.path,
                          ...match,
                      }]
                    : []
            }),
        ),
    )

    const claimed = new Set<string>()
    return candidates
        .sort((left, right) => right.confidence - left.confidence)
        .filter((candidate) => {
            if (claimed.has(candidate.targetPath)) return false
            claimed.add(candidate.targetPath)
            return true
        })
        .map((candidate) => ({ ...candidate, confidence: Number(candidate.confidence.toFixed(2)) }))
}
