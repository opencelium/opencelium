import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.ts'
import { flattenFieldPaths, normalizePath } from '../src/invokers/fieldPaths.ts'
import { parseInvoker } from '../src/invokers/parseInvoker.ts'
import { tracker } from './fixtures.ts'

describe('parseInvoker', () => {
    it('drops the test operation and separates endpoint params from connector settings', () => {
        expect(tracker.name).toBe('Tracker')
        expect(tracker.requiredData).toEqual(['url', 'token'])
        expect(tracker.operations.map((operation) => operation.name)).toEqual(['ListIssues'])
        expect(tracker.operations[0]).toMatchObject({
            httpMethod: 'GET',
            endpoint: '{url}/projects/{PROJECT}/issues',
            endpointParams: ['PROJECT'],
        })
    })

    it('flattens nested response fields into dot paths with array markers', () => {
        const paths = flattenFieldPaths(tracker.operations[0]?.responseFields ?? []).map((field) => field.path)
        expect(paths).toEqual([
            'issues[]',
            'issues[].key',
            'issues[].fields',
            'issues[].fields.summary',
            'issues[].fields.priority',
            'issues[].fields.priority.name',
        ])
    })

    it('rejects documents without an invoker root', () => {
        expect(() => parseInvoker('<connector/>')).toThrow(/invoker/)
    })

    it('parses every invoker shipped with the backend', () => {
        const dir = loadConfig({}).invokerDir
        const files = readdirSync(dir).filter((file) => file.endsWith('.xml'))
        expect(files.length).toBeGreaterThan(0)
        for (const file of files) {
            const invoker = parseInvoker(readFileSync(`${dir}/${file}`, 'utf8'))
            expect(invoker.name, file).not.toBe('')
        }
    })
})

describe('normalizePath', () => {
    it.each([
        ['issues[0].key', 'issues.key'],
        ['issues[].key', 'issues.key'],
        ['$.issues[*].key', 'issues.key'],
        ['[0].id', 'id'],
    ])('%s -> %s', (input, expected) => {
        expect(normalizePath(input)).toBe(expected)
    })
})
