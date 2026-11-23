import { describe, expect, it } from 'vitest'
import type { ConstantVariable, MutableVariable, ScriptVariable } from './types'
import { emptyScript } from './script'
import {
    isOwnerMissing,
    isScopeIncomplete,
    isValueMissing,
    jsonTypeOf,
    textToValue,
    toFormValues,
    toSaveDto,
    valueToText,
    type GlobalVariableFormValues,
} from './form'

const constant = (overrides: Partial<ConstantVariable> = {}): ConstantVariable => ({
    id: 7, name: 'tenants', kind: 'CONSTANT', description: 'Tenants', value: [{ id: 'acme' }], secret: false, hasValue: true,
    scope: { type: 'CATEGORIES', categories: [{ id: 3, name: 'CMDB' }], workflows: [] },
    ownerUser: { id: 1, name: 'admin' }, myPermissions: ['VIEW_USE', 'EDIT', 'DELETE'], version: 4,
    createdAt: '', createdBy: { type: 'USER', id: 1, name: 'admin' }, updatedAt: '', updatedBy: { type: 'USER', id: 1, name: 'admin' },
    ...overrides,
})

const values = (overrides: Partial<GlobalVariableFormValues> = {}): GlobalVariableFormValues => ({
    kind: 'CONSTANT', name: ' idoitUrl ', description: '', secret: false, value: 'https://cmdb', script: emptyScript(),
    busyPolicy: 'QUEUE', ownerWorkflowId: null,
    scope: { type: 'ALL', categoryIds: [9], workflowIds: [8] }, ...overrides,
})

describe('value text', () => {
    it('reads JSON when it parses and keeps anything else as a string', () => {
        expect(textToValue('42')).toBe(42)
        expect(textToValue('true')).toBe(true)
        expect(textToValue('null')).toBeNull()
        expect(textToValue('[1, {"a": 2}]')).toEqual([1, { a: 2 }])
        expect(textToValue('https://cmdb')).toBe('https://cmdb')
        expect(textToValue('"42"')).toBe('42')
    })

    it('writes values back so they read the same', () => {
        for (const value of ['plain text', '42', 'true', 42, false, null, [1, 2], { a: { b: 1 } }]) {
            expect(textToValue(valueToText(value))).toEqual(value)
        }
        expect(valueToText('plain text')).toBe('plain text')
        expect(valueToText('42')).toBe('"42"')
    })

    it('names the JSON type', () => {
        expect([null, [], {}, 's', 1, true].map(jsonTypeOf)).toEqual(['null', 'array', 'object', 'string', 'number', 'boolean'])
    })
})

describe('form mapping', () => {
    it('maps a constant into form values', () => {
        expect(toFormValues(constant())).toMatchObject({
            id: 7, version: 4, kind: 'CONSTANT', value: '[\n  {\n    "id": "acme"\n  }\n]',
            scope: { type: 'CATEGORIES', categoryIds: [3], workflowIds: [] },
        })
    })

    it('never puts a secret into the form', () => {
        expect(toFormValues(constant({ secret: true, value: null }))?.value).toBe('')
    })

    it('builds the create DTO and drops ids the scope type does not use', () => {
        expect(toSaveDto(values(), 'create')).toEqual({
            kind: 'CONSTANT', name: 'idoitUrl', description: '', secret: false, value: 'https://cmdb',
            scope: { type: 'ALL', categoryIds: [], workflowIds: [] },
        })
    })

    it('sends the version on update and leaves a blank secret out to keep it', () => {
        const dto = toSaveDto(values({ secret: true, value: '', version: 5, hasValue: true }), 'update')
        expect(dto.version).toBe(5)
        expect('value' in dto).toBe(false)
        expect(toSaveDto(values({ secret: true, value: 'new', version: 5 }), 'update')).toMatchObject({ value: 'new' })
    })

    it('requires a value unless a stored secret is kept', () => {
        expect(isValueMissing(values({ value: ' ' }))).toBe(true)
        expect(isValueMissing(values({ value: '', secret: true, hasValue: true }))).toBe(false)
        expect(isValueMissing(values({ value: '', secret: true }))).toBe(true)
        expect(isValueMissing({})).toBe(true)
    })

    it('requires a target for category and workflow scopes', () => {
        expect(isScopeIncomplete({ type: 'CATEGORIES', categoryIds: [], workflowIds: [] })).toBe(true)
        expect(isScopeIncomplete({ type: 'WORKFLOWS', categoryIds: [], workflowIds: [1] })).toBe(false)
        expect(isScopeIncomplete({ type: 'ALL', categoryIds: [], workflowIds: [] })).toBe(false)
    })
})

describe('script form mapping', () => {
    const script: ScriptVariable = {
        id: 15, name: 'buildTitle', kind: 'SCRIPT', description: 'd',
        script: {
            language: 'js', code: 'return a;',
            parameters: [{ name: 'a', required: true, default: null }, { name: 'p', required: false, default: 'low' }],
        },
        scope: { type: 'ALL', categories: [], workflows: [] }, ownerUser: { id: 1, name: 'admin' },
        myPermissions: ['EDIT'], version: 3, createdAt: '', createdBy: { type: 'USER', id: 1, name: 'admin' },
        updatedAt: '', updatedBy: { type: 'USER', id: 1, name: 'admin' },
    }

    it('loads parameters with their defaults as editable text', () => {
        expect(toFormValues(script)?.script.parameters).toEqual([
            { name: 'a', description: '', required: true, defaultText: '' },
            { name: 'p', description: '', required: false, defaultText: 'low' },
        ])
    })

    it('saves the script without a value and parses defaults back', () => {
        const form = toFormValues(script)
        expect(form).not.toBeNull()
        const dto = toSaveDto({ ...form!, script: { ...form!.script, parameters: [
            ...form!.script.parameters, { name: ' n ', description: ' Count ', required: false, defaultText: '5' },
        ] } }, 'update')
        expect(dto).toEqual({
            kind: 'SCRIPT', name: 'buildTitle', description: 'd', version: 3,
            scope: { type: 'ALL', categoryIds: [], workflowIds: [] },
            script: {
                language: 'js', code: 'return a;',
                parameters: [
                    { name: 'a', required: true, default: null },
                    { name: 'p', required: false, default: 'low' },
                    { name: 'n', description: 'Count', required: false, default: 5 },
                ],
            },
        })
    })

    it('does not ask a script for a value', () => {
        expect(isValueMissing({ kind: 'SCRIPT', value: '' })).toBe(false)
    })
})

describe('mutable form mapping', () => {
    const mutable: MutableVariable = {
        id: 9, name: 'lastSync', kind: 'MUTABLE', description: '', value: null,
        mutable: {
            currentValue: '2026-11-20T00:00:00Z', revision: 12, setAt: null, setBy: null, setByExecutionId: null,
            busyPolicy: 'REFUSE', ownerWorkflow: { id: 42, title: 'VMware → i-doit' },
        },
        scope: { type: 'ALL', categories: [], workflows: [] }, ownerUser: { id: 1, name: 'admin' },
        myPermissions: ['EDIT'], version: 2, createdAt: '', createdBy: { type: 'USER', id: 1, name: 'admin' },
        updatedAt: '', updatedBy: { type: 'USER', id: 1, name: 'admin' },
    }

    it('loads the busy policy and owner from the mutable part, and the initial value', () => {
        expect(toFormValues(mutable)).toMatchObject({ kind: 'MUTABLE', value: 'null', busyPolicy: 'REFUSE', ownerWorkflowId: 42 })
    })

    it('saves the busy policy and owner with the value and no secret flag', () => {
        expect(toSaveDto(values({ kind: 'MUTABLE', value: '0', busyPolicy: 'REFUSE', ownerWorkflowId: 42 }), 'create'))
            .toEqual({
                kind: 'MUTABLE', name: 'idoitUrl', description: '', value: 0,
                busyPolicy: 'REFUSE', ownerWorkflowId: 42,
                scope: { type: 'ALL', categoryIds: [], workflowIds: [] },
            })
    })

    it('requires an owner workflow', () => {
        expect(isOwnerMissing({ kind: 'MUTABLE', ownerWorkflowId: null })).toBe(true)
        expect(isOwnerMissing({ kind: 'MUTABLE', ownerWorkflowId: 42 })).toBe(false)
        expect(isOwnerMissing({ kind: 'CONSTANT', ownerWorkflowId: null })).toBe(false)
    })
})
