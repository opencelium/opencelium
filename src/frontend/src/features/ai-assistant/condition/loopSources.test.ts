import { describe, expect, it } from 'vitest'
import type { Connection, MethodWithId } from '@features/workflow/types/connection'
import { collectLoopSources } from './loopSources'
import { loopSuggestionToTree } from './conditionSuggestion.utils'

const search = {
    id: 'm1', name: 'SearchIssues', label: 'SearchIssues', color: '#C77E7E', index: '0', connector: { title: 'Jira' },
    response: { success: { body: { fields: { total: 3, expand: 'names,schema', names: { summary: '' },
        issues: [{ key: '', fields: { labels: [''] } }] } } } },
} as unknown as MethodWithId

const connection = (loops: { index: string; expression: string }[] = []) => ({
    fromConnector: { operator: loops.map((loop) => ({ type: 'loop', iterator: 'i', ...loop })) },
}) as unknown as Connection

describe('collectLoopSources', () => {
    it('offers lists whole, objects and texts, with the reference the picker writes', () => {
        const sources = collectLoopSources(connection(), [search], '1')
        expect(sources.map(({ path, kind }) => `${kind} ${path}`)).toEqual(['text expand', 'object names', 'text names.summary', 'list issues[*]'])
        expect(sources.find((source) => source.kind === 'list')?.reference).toBe('#C77E7E.(response).body.$.issues[*]')
    })

    it('enters a list a surrounding loop runs over at its item, for the lists inside it', () => {
        const sources = collectLoopSources(connection([{ index: '1', expression: 'for {%#C77E7E.(response).body.$.issues[*]%}' }]), [search], '1_0')
        expect(sources.map((source) => source.path)).toContain('issues[i].fields.labels[*]')
        expect(sources.map((source) => source.path)).not.toContain('issues[*]')
    })
})

describe('loopSuggestionToTree', () => {
    const sources = collectLoopSources(connection(), [search], '1')
    const list = sources.find((source) => source.kind === 'list')!
    const text = sources.find((source) => source.kind === 'text')!

    it('writes the loop\'s one rule, with the delimiter only for split text', () => {
        const tree = loopSuggestionToTree({ operator: 'for', source: list.id, delimiter: '', explanation: '', durationMs: 1, model: 'm' }, sources)
        expect(tree?.items?.[0]?.properties).toEqual({ operator: 'for', leftField: '#C77E7E.(response).body.$.issues[*]' })
        const split = loopSuggestionToTree({ operator: 'SplitString', source: text.id, delimiter: ';', explanation: '', durationMs: 1, model: 'm' }, sources)
        expect(split?.items?.[0]?.properties).toEqual({ operator: 'SplitString', leftField: text.reference, rightField: ';' })
    })

    it('refuses a value that was not offered', () => {
        expect(loopSuggestionToTree({ operator: 'for', source: 'zz', delimiter: '', explanation: '', durationMs: 1, model: 'm' }, sources)).toBeUndefined()
    })
})
