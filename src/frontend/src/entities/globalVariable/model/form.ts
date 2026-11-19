import type { Mode } from '@/engine/entity/EntityDefinition'
import type {
    ConstantSaveDto,
    GlobalVariable,
    GlobalVariableKind,
    GlobalVariableScopeDto,
    JsonValue,
} from './types'

// Kinds the form can create and edit today; mutable and script kinds join in later phases.
export const FORM_KINDS = ['CONSTANT'] as const satisfies readonly GlobalVariableKind[]
export type FormKind = (typeof FORM_KINDS)[number]

export const isFormKind = (kind: GlobalVariableKind): kind is FormKind =>
    (FORM_KINDS as readonly GlobalVariableKind[]).includes(kind)

export const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/
export const MAX_VALUE_BYTES = 64 * 1024

export type GlobalVariableFormValues = {
    id?: number
    version?: number
    hasValue?: boolean
    kind: FormKind
    name: string
    description: string
    secret: boolean
    value: string
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

export function toFormValues(variable: GlobalVariable): GlobalVariableFormValues | null {
    if (variable.kind !== 'CONSTANT') return null
    return {
        id: variable.id,
        version: variable.version,
        hasValue: variable.hasValue,
        kind: variable.kind,
        name: variable.name,
        description: variable.description ?? '',
        secret: variable.secret,
        value: variable.secret ? '' : valueToText(variable.value),
        scope: {
            type: variable.scope.type,
            categoryIds: variable.scope.categories.map((category) => category.id),
            workflowIds: variable.scope.workflows.map((workflow) => workflow.id),
        },
    }
}

const keepsStoredSecret = (values: GlobalVariableFormValues, mode: Mode) =>
    mode === 'update' && values.secret && values.value.trim() === ''

export function toSaveDto(values: GlobalVariableFormValues, mode: Mode): ConstantSaveDto {
    const scope: GlobalVariableScopeDto = {
        type: values.scope.type,
        categoryIds: values.scope.type === 'CATEGORIES' ? values.scope.categoryIds : [],
        workflowIds: values.scope.type === 'WORKFLOWS' ? values.scope.workflowIds : [],
    }
    return {
        kind: values.kind,
        name: values.name.trim(),
        description: values.description.trim(),
        secret: values.secret,
        scope,
        ...(keepsStoredSecret(values, mode) ? {} : { value: textToValue(values.value) }),
        ...(mode === 'update' ? { version: values.version } : {}),
    }
}

// `hasValue` only comes from a loaded variable, so a blank secret is allowed on update only.
export const isValueMissing = (values: Partial<GlobalVariableFormValues>) =>
    (values.value ?? '').trim() === '' && !(values.secret && values.hasValue)

export const isScopeIncomplete = (scope: GlobalVariableScopeDto | undefined) =>
    !!scope
    && ((scope.type === 'CATEGORIES' && scope.categoryIds.length === 0)
        || (scope.type === 'WORKFLOWS' && scope.workflowIds.length === 0))
