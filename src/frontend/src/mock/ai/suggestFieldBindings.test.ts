import { describe, expect, it } from 'vitest'
import type {
    FieldBindingSuggestionRequest,
    SchemaField,
} from '@features/workflow/ai/fieldBindingSuggestion.types'
import { suggestFieldBindings } from './suggestFieldBindings'

const field = (path: string, kind: SchemaField['kind'] = 'string'): SchemaField => ({ path, kind })

const request = (
    targetFields: SchemaField[],
    sourceFields: SchemaField[],
): FieldBindingSuggestionRequest => ({
    target: { label: 'create issue', connectorTitle: 'Redmine', fields: targetFields },
    sources: [{ color: '#aabbcc', label: 'get ticket', connectorTitle: 'Jira', fields: sourceFields }],
})

describe('suggestFieldBindings', () => {
    it('matches identical field names with near-certain confidence', () => {
        const [suggestion] = suggestFieldBindings(request([field('$.email')], [field('$.email')]))

        expect(suggestion).toMatchObject({
            targetPath: '$.email',
            sourcePath: '$.email',
            sourceColor: '#aabbcc',
            origin: 'deterministic',
        })
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0.94)
    })

    it('ranks a whole-path match above a same-name match at a different depth', () => {
        const suggestions = suggestFieldBindings(
            request([field('$.customer.email')], [field('$.customer.email'), field('$.owner.email')]),
        )

        expect(suggestions).toHaveLength(1)
        expect(suggestions[0].sourcePath).toBe('$.customer.email')
    })

    it('matches synonyms across naming conventions', () => {
        const [suggestion] = suggestFieldBindings(request([field('$.emailAddress')], [field('$.mail')]))

        expect(suggestion).toMatchObject({ origin: 'model' })
        expect(suggestion.rationale).toBeTruthy()
    })

    it('matches a German source name to an English target name', () => {
        const [suggestion] = suggestFieldBindings(request([field('$.lastName')], [field('$.nachname')]))

        expect(suggestion?.sourcePath).toBe('$.nachname')
    })

    it('gives each target field at most one source', () => {
        const suggestions = suggestFieldBindings(
            request([field('$.name')], [field('$.name'), field('$.title'), field('$.label')]),
        )

        expect(suggestions).toHaveLength(1)
    })

    it('lets one source feed several target fields', () => {
        const suggestions = suggestFieldBindings(
            request([field('$.name'), field('$.title')], [field('$.name')]),
        )

        expect(suggestions.map((item) => item.targetPath).sort()).toEqual(['$.name', '$.title'])
    })

    it('discounts a match whose types disagree and says why', () => {
        const [matched] = suggestFieldBindings(request([field('$.id')], [field('$.id')]))
        const [mismatched] = suggestFieldBindings(
            request([field('$.id', 'string')], [field('$.id', 'number')]),
        )

        expect(mismatched.confidence).toBeLessThan(matched.confidence)
        expect(mismatched.rationale).toContain('enhancement script')
    })

    it('keeps a dotted quoted key whole instead of matching its tail', () => {
        const suggestions = suggestFieldBindings(
            request([field("$.['@odata.id']"), field('$.id')],
                [field("$[0].['@odata.id']"), field('$[0].id')]),
        )

        expect(suggestions.map((item) => [item.sourcePath, item.targetPath])).toEqual(
            expect.arrayContaining([
                ["$[0].['@odata.id']", "$.['@odata.id']"],
                ['$[0].id', '$.id'],
            ]),
        )
    })

    it('names an array leaf by its field, not its subscript', () => {
        const [suggestion] = suggestFieldBindings(
            request([field('$.units[0]')], [field('$[0].units[0]')]),
        )

        expect(suggestion).toMatchObject({ sourcePath: '$[0].units[0]', origin: 'deterministic' })
    })

    it('proposes nothing when no name is related', () => {
        expect(suggestFieldBindings(request([field('$.sku')], [field('$.latitude')]))).toEqual([])
    })

    it('reports a pair this connector combination has been mapped as before', () => {
        const [suggestion] = suggestFieldBindings(request([field('$.summary')], [field('$.name')]))

        expect(suggestion).toMatchObject({ origin: 'precedent' })
    })
})
