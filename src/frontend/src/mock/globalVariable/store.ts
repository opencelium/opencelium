import type {
    GlobalVariable,
    GlobalVariableChange,
    GlobalVariableListItem,
    GlobalVariableSaveDto,
    GlobalVariableScope,
    GlobalVariableScopeDto,
    GlobalVariableValue,
    JsonValue,
} from '@entities/globalVariable/model/types'
import { seedChanges, seedGrants, seedUsages, seedVariables } from './data'

export const MASK = '••••'
const NAME_RE = /^[A-Za-z][A-Za-z0-9_]{0,63}$/

export const db = {
    variables: seedVariables(),
    usages: seedUsages(),
    grants: seedGrants(),
    changes: seedChanges(),
    nextId: 100,
    nextChangeId: 1000,
}

export const findVariable = (id: number) => db.variables.find((variable) => variable.id === id)

export const isValidName = (name: string) => NAME_RE.test(name)

const isSecret = (variable: GlobalVariable) => variable.kind === 'CONSTANT' && variable.secret

export function toDetail(variable: GlobalVariable): GlobalVariable {
    return variable.kind === 'CONSTANT' && variable.secret ? { ...variable, value: null } : variable
}

export function toListItem(variable: GlobalVariable): GlobalVariableListItem {
    const isScript = variable.kind === 'SCRIPT'
    const isMutable = variable.kind === 'MUTABLE'
    return {
        id: variable.id,
        name: variable.name,
        kind: variable.kind,
        description: variable.description,
        secret: isSecret(variable),
        valuePreview: isScript || isSecret(variable) ? null : JSON.stringify(variable.value).slice(0, 100),
        language: isScript ? variable.script.language : null,
        parameterCount: isScript ? variable.script.parameters.length : null,
        scopeType: variable.scope.type,
        writePolicy: isMutable ? variable.writePolicy : null,
        publishMode: isMutable ? variable.publishMode : null,
        ownerWorkflow: isMutable ? variable.ownerWorkflow : null,
        beingUpdatedBy: isMutable ? variable.beingUpdatedBy : null,
        usageCount: db.usages[variable.id]?.length ?? 0,
        myPermissions: variable.myPermissions,
        version: variable.version,
        updatedAt: variable.updatedAt,
        updatedBy: variable.updatedBy,
    }
}

export function toValue(variable: Exclude<GlobalVariable, { kind: 'SCRIPT' }>): GlobalVariableValue {
    return {
        id: variable.id,
        version: variable.version,
        value: isSecret(variable) ? null : variable.value,
        updatedAt: variable.updatedAt,
        updatedBy: variable.updatedBy,
        beingUpdatedBy: variable.kind === 'MUTABLE' ? variable.beingUpdatedBy : null,
    }
}

const toScope = (dto: GlobalVariableScopeDto): GlobalVariableScope => ({
    type: dto.type,
    categories: dto.categoryIds.map((id) => ({ id, name: `Category ${id}` })),
    workflows: dto.workflowIds.map((id) => ({ id, name: `Workflow ${id}` })),
})

export function applySave(dto: GlobalVariableSaveDto, previous: GlobalVariable | undefined): GlobalVariable {
    const now = new Date().toISOString()
    const base = {
        id: previous?.id ?? db.nextId++,
        name: dto.name,
        description: dto.description,
        scope: toScope(dto.scope),
        ownerUser: previous?.ownerUser ?? { id: 1, name: 'admin' },
        myPermissions: previous?.myPermissions ?? ['VIEW_USE', 'EDIT', 'DELETE'],
        version: previous ? previous.version + 1 : 1,
        createdAt: previous?.createdAt ?? now,
        createdBy: previous?.createdBy ?? { type: 'USER' as const, id: 1, name: 'admin' },
        updatedAt: now,
        updatedBy: { type: 'USER' as const, id: 1, name: 'admin' },
    }
    switch (dto.kind) {
        case 'CONSTANT': {
            const kept = previous?.kind === 'CONSTANT' ? previous.value : null
            const value = dto.value === undefined || (dto.secret && dto.value === null) ? kept : dto.value
            return { ...base, kind: 'CONSTANT', value, secret: dto.secret, hasValue: value !== null }
        }
        case 'MUTABLE':
            return {
                ...base,
                kind: 'MUTABLE',
                value: dto.value,
                writePolicy: dto.writePolicy,
                publishMode: dto.publishMode,
                ownerWorkflow: dto.ownerWorkflowId ? { id: dto.ownerWorkflowId, title: `Workflow ${dto.ownerWorkflowId}` } : null,
                beingUpdatedBy: null,
            }
        case 'SCRIPT':
            return { ...base, kind: 'SCRIPT', script: { ...dto.script, refs: extractRefs(dto.script.code) } }
        default: {
            const _exhaustive: never = dto
            return _exhaustive
        }
    }
}

const REF_LITERAL_RE = /ref\(\s*"([^"]+)"\s*\)/g

export function extractRefs(code: string) {
    return Array.from(code.matchAll(REF_LITERAL_RE), (match) => {
        const ref = match[1]
        if (ref.startsWith('{{global.')) return { ref, type: 'GLOBAL' as const }
        if (ref.startsWith('${')) return { ref, type: 'WEBHOOK' as const }
        if (ref.startsWith('@{')) return { ref, type: 'PAGE' as const }
        if (ref.startsWith('#')) return { ref, type: 'METHOD_RESPONSE' as const, warning: 'TIED_TO_CALLER_COLORS' as const }
        return { ref, type: 'REQUEST_DATA' as const }
    })
}

export function logChange(variable: GlobalVariable, change: Omit<GlobalVariableChange, 'id' | 'changedAt' | 'actor' | 'result' | 'reason' | 'source' | 'writeCount'>) {
    const masked = (value: JsonValue) => (isSecret(variable) && value !== null ? MASK : value)
    const entry: GlobalVariableChange = {
        ...change,
        id: db.nextChangeId++,
        oldValue: masked(change.oldValue),
        newValue: masked(change.newValue),
        writeCount: null,
        actor: { type: 'USER', userId: 1, userName: 'admin' },
        source: null,
        result: 'SAVED',
        reason: null,
        changedAt: new Date().toISOString(),
    }
    db.changes[variable.id] = [entry, ...(db.changes[variable.id] ?? [])]
}

let lastTick = Date.now()

// Advances the mutable demo variables every 15 s so the 5 s polling has something to show.
export function simulateRunWrites() {
    if (Date.now() - lastTick < 15_000) return
    lastTick = Date.now()
    const now = new Date().toISOString()
    db.variables = db.variables.map((variable) => {
        if (variable.kind !== 'MUTABLE') return variable
        const value = typeof variable.value === 'number'
            ? variable.value + 10
            : new Date(new Date(String(variable.value)).getTime() + 3_600_000).toISOString().replace('.000Z', 'Z')
        return {
            ...variable,
            value,
            version: variable.version + 1,
            updatedAt: now,
            updatedBy: { type: 'WORKFLOW', id: 42, name: 'VMware → i-doit' },
        }
    })
}
