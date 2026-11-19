import type { Mode } from '@/engine/entity/EntityDefinition'
import type {
    GlobalVariable,
    GlobalVariableKind,
    GlobalVariableSaveDto,
    GlobalVariableScopeDto,
    JsonValue,
    ScriptParameter,
} from './types'
import { emptyScript, type ScriptFormValues, type ScriptParameterDraft } from './script'

// Kinds the form can create and edit today; the mutable kind joins in phase 3.
export const FORM_KINDS = ['CONSTANT', 'SCRIPT'] as const satisfies readonly GlobalVariableKind[]
export type FormKind = (typeof FORM_KINDS)[number]

export const isFormKind = (kind: GlobalVariableKind): kind is FormKind =>
    (FORM_KINDS as readonly GlobalVariableKind[]).includes(kind)

export const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/
export const MAX_VALUE_BYTES = 64 * 1024

// One flat shape for every kind, because the entity wizard owns a single form; `toSaveDto`
// sends only what the chosen kind uses.
export type GlobalVariableFormValues = {
    id?: number
    version?: number
    hasValue?: boolean
    kind: FormKind
    name: string
    description: string
    secret: boolean
    value: string
    script: ScriptFormValues
    scope: GlobalVariableScopeDto
}

export type ValueJsonType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'

const tryParse = (text: string): { ok: true; value: JsonValue } | { ok: false } => {
    try {
        return { ok: true, value: JSON.parse(text) as JsonValue }
    } catch {
        return { ok: false }
    }
}

// Typed text is JSON when it parses, otherwise a plain string; `"123"` keeps a numeric-looking string a string.
export function textToValue(text: string): JsonValue {
    const parsed = tryParse(text.trim())
    return parsed.ok ? parsed.value : text
}

export function valueToText(value: JsonValue): string {
    if (typeof value === 'string') return tryParse(value.trim()).ok ? JSON.stringify(value) : value
    return JSON.stringify(value, null, 2)
}

export function jsonTypeOf(value: JsonValue): ValueJsonType {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    switch (typeof value) {
        case 'string':
            return 'string'
        case 'number':
            return 'number'
        case 'boolean':
            return 'boolean'
        default:
            return 'object'
    }
}

export const valueByteSize = (text: string) => new TextEncoder().encode(text).length

export const emptyScope = (): GlobalVariableScopeDto => ({ type: 'ALL', categoryIds: [], workflowIds: [] })

const toParameterDraft = (parameter: ScriptParameter): ScriptParameterDraft => ({
    name: parameter.name,
    required: parameter.required,
    defaultText: parameter.required || parameter.default === undefined || parameter.default === null
        ? '' : valueToText(parameter.default),
})

export const toParameter = (draft: ScriptParameterDraft): ScriptParameter => ({
    name: draft.name.trim(),
    required: draft.required,
    default: draft.required || draft.defaultText.trim() === '' ? null : textToValue(draft.defaultText),
})

export function toFormValues(variable: GlobalVariable): GlobalVariableFormValues | null {
    const base = {
        id: variable.id,
        version: variable.version,
        name: variable.name,
        description: variable.description ?? '',
        scope: {
            type: variable.scope.type,
            categoryIds: variable.scope.categories.map((category) => category.id),
            workflowIds: variable.scope.workflows.map((workflow) => workflow.id),
        },
    }
    switch (variable.kind) {
        case 'CONSTANT':
            return {
                ...base,
                kind: 'CONSTANT',
                hasValue: variable.hasValue,
                secret: variable.secret,
                value: variable.secret ? '' : valueToText(variable.value),
                script: emptyScript(),
            }
        case 'SCRIPT':
            return {
                ...base,
                kind: 'SCRIPT',
                secret: false,
                value: '',
                script: {
                    language: variable.script.language,
                    code: variable.script.code,
                    parameters: variable.script.parameters.map(toParameterDraft),
                    imports: variable.script.imports,
                },
            }
        case 'MUTABLE':
            return null
        default: {
            const _exhaustive: never = variable
            return _exhaustive
        }
    }
}

const keepsStoredSecret = (values: GlobalVariableFormValues, mode: Mode) =>
    mode === 'update' && values.secret && values.value.trim() === ''

export function toSaveDto(values: GlobalVariableFormValues, mode: Mode): GlobalVariableSaveDto {
    const base = {
        name: values.name.trim(),
        description: values.description.trim(),
        scope: {
            type: values.scope.type,
            categoryIds: values.scope.type === 'CATEGORIES' ? values.scope.categoryIds : [],
            workflowIds: values.scope.type === 'WORKFLOWS' ? values.scope.workflowIds : [],
        },
        ...(mode === 'update' ? { version: values.version } : {}),
    }
    switch (values.kind) {
        case 'CONSTANT':
            return {
                ...base,
                kind: 'CONSTANT',
                secret: values.secret,
                ...(keepsStoredSecret(values, mode) ? {} : { value: textToValue(values.value) }),
            }
        case 'SCRIPT':
            return {
                ...base,
                kind: 'SCRIPT',
                script: {
                    language: values.script.language,
                    code: values.script.code,
                    parameters: values.script.parameters.map(toParameter),
                    imports: values.script.imports,
                },
            }
        default: {
            const _exhaustive: never = values.kind
            return _exhaustive
        }
    }
}

// `hasValue` only comes from a loaded variable, so a blank secret is allowed on update only.
export const isValueMissing = (values: Partial<GlobalVariableFormValues>) =>
    values.kind !== 'SCRIPT' && (values.value ?? '').trim() === '' && !(values.secret && values.hasValue)

export const isCodeMissing = (values: Partial<GlobalVariableFormValues>) =>
    values.kind === 'SCRIPT' && (values.script?.code ?? '').trim() === ''

export const isScopeIncomplete = (scope: GlobalVariableScopeDto | undefined) =>
    !!scope
    && ((scope.type === 'CATEGORIES' && scope.categoryIds.length === 0)
        || (scope.type === 'WORKFLOWS' && scope.workflowIds.length === 0))
