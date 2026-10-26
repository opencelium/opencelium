import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.ts'
import { assignableRequestPaths, flattenFieldPaths, isConnectorManaged, normalizePath } from '../src/invokers/fieldPaths.ts'
import { parseInvoker } from '../src/invokers/parseInvoker.ts'
import { helpdesk, tracker } from './fixtures.ts'

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

describe('connector-managed fields', () => {
    it.each([
        ['{apikey}', true],
        ['Basic {username:password}', true],
        ['{APIKEY}', true],
        ['{ISSUEID}', false],
        ['plain', false],
        ['', false],
    ])('%s -> %s', (value, expected) => {
        expect(isConnectorManaged(value, ['url', 'apikey', 'username', 'password'])).toBe(expected)
    })

    it('leaves credential fields out of the assignable request paths', () => {
        const fields = helpdesk.operations[0]?.requestFields ?? []
        expect(assignableRequestPaths(fields, helpdesk.requiredData).map((field) => field.path))
            .toEqual(['title', 'article', 'article.body'])
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
