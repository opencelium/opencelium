import { http, HttpResponse } from 'msw'
import type {
    GlobalVariable,
    GlobalVariableConflictError,
    GlobalVariablePermissionsDto,
    GlobalVariableSaveDto,
    GlobalVariableValidationError,
    ImpactEntry,
    ImpactRequest,
    PickerItem,
    ValidateScriptRequest,
    ValidateScriptResponse,
} from '@entities/globalVariable/model/types'
import {
    applySave,
    db,
    extractRefs,
    findVariable,
    isValidName,
    logChange,
    simulateRunWrites,
    toDetail,
    toListItem,
    toValue,
} from './store'

// `*/` matches any origin, so these mocks also answer when API_URL points at a real backend on another port.
const BASE = '*/global-variable'

const notFound = () => HttpResponse.json({ status: 404, error: 'NOT_FOUND', message: 'Global variable not found' }, { status: 404 })

const invalid = (field: string, code: GlobalVariableValidationError['violations'][number]['code'], message: string) =>
    HttpResponse.json<GlobalVariableValidationError>({
        timestamp: new Date().toISOString(), status: 400, error: 'GLOBAL_VARIABLE_INVALID', message, path: '/global-variable',
        violations: [{ field, code, message }],
    }, { status: 400 })

const conflict = (body: Omit<GlobalVariableConflictError, 'status' | 'error'>) =>
    HttpResponse.json<GlobalVariableConflictError>({ status: 409, error: 'GLOBAL_VARIABLE_CONFLICT', ...body }, { status: 409 })

const blockingUsages = (variable: GlobalVariable): ImpactEntry[] =>
    (db.usages[variable.id] ?? []).map((usage) => ({ ...usage, reason: 'IN_USE' }))

function validateSave(dto: GlobalVariableSaveDto, id?: number) {
    if (!isValidName(dto.name)) return invalid('name', 'NAME_INVALID', 'Letters, digits and _, starting with a letter, at most 64')
    if (db.variables.some((variable) => variable.name === dto.name && variable.id !== id)) {
        return invalid('name', 'NAME_TAKEN', 'Name is already taken')
    }
    if (dto.kind === 'SCRIPT' && /ref\(\s*[^"\s)]/.test(dto.script.code)) {
        return invalid('script.code', 'REF_NOT_LITERAL', 'ref() needs a string literal')
    }
    return null
}

export const globalVariableHandlers = [
    http.get(`${BASE}/all`, ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? 0)
        const size = Number(url.searchParams.get('size') ?? 20)
        const search = (url.searchParams.get('search') ?? '').toLowerCase()
        const kind = url.searchParams.get('kind')
        const [sortField, sortDir] = (url.searchParams.get('sort') ?? 'name,asc').split(',')
        const filtered = db.variables
            .filter((variable) => !kind || variable.kind === kind)
            .filter((variable) => !search || `${variable.name} ${variable.description}`.toLowerCase().includes(search))
            .map(toListItem)
            .sort((a, b) => {
                const left = String(a[sortField as keyof typeof a] ?? '')
                const right = String(b[sortField as keyof typeof b] ?? '')
                return sortDir === 'desc' ? right.localeCompare(left) : left.localeCompare(right)
            })
        return HttpResponse.json({
            content: filtered.slice(page * size, page * size + size),
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(filtered.length / size)),
            totalItems: filtered.length,
        })
    }),

    http.get(`${BASE}/values`, ({ request }) => {
        simulateRunWrites()
        const ids = (new URL(request.url).searchParams.get('ids') ?? '').split(',').filter(Boolean).map(Number)
        if (ids.length > 100) return HttpResponse.json({ status: 400, message: 'At most 100 ids' }, { status: 400 })
        const variables = ids.map(findVariable).filter((variable): variable is GlobalVariable => !!variable)
        if (variables.some((variable) => variable.kind === 'SCRIPT')) {
            return HttpResponse.json({ status: 400, message: 'Script variables have no value' }, { status: 400 })
        }
        const values = variables.flatMap((variable) => (variable.kind === 'SCRIPT' ? [] : [toValue(variable)]))
        const etag = `"${values.map((value) => `${value.id}:${value.version}`).join('-')}"`
        if (request.headers.get('If-None-Match') === etag) return new HttpResponse(null, { status: 304, headers: { ETag: etag } })
        return HttpResponse.json(values, { headers: { ETag: etag } })
    }),

    http.get(`${BASE}/picker`, ({ request }) => {
        const onlyAllScope = new URL(request.url).searchParams.has('connectorId')
        const items: PickerItem[] = db.variables
            .filter((variable) => !onlyAllScope || variable.scope.type === 'ALL')
            .map((variable) => {
                const base = { name: variable.name, description: variable.description }
                switch (variable.kind) {
                    case 'CONSTANT':
                        return { ...base, kind: 'CONSTANT', secret: variable.secret, valuePreview: variable.secret ? null : JSON.stringify(variable.value) }
                    case 'MUTABLE':
                        return {
                            ...base, kind: 'MUTABLE', secret: false, valuePreview: JSON.stringify(variable.value),
                            ownerWorkflow: variable.ownerWorkflow, writable: !variable.ownerWorkflow || variable.ownerWorkflow.id === 42,
                        }
                    case 'SCRIPT':
                        return { ...base, kind: 'SCRIPT', language: variable.script.language, parameters: variable.script.parameters, refs: variable.script.refs }
                    default: {
                        const _exhaustive: never = variable
                        return _exhaustive
                    }
                }
            })
        return HttpResponse.json(items)
    }),

    http.get(`${BASE}/unique/:name`, ({ params }) =>
        HttpResponse.json({ result: !db.variables.some((variable) => variable.name === params.name) })),

    http.post(`${BASE}/validate-script`, async ({ request }) => {
        const body = (await request.json()) as ValidateScriptRequest
        const base = { result: null, resultJsonType: 'null' as const, durationMs: 0, refs: [], warnings: [] }
        if (body.language !== 'js') {
            return HttpResponse.json<ValidateScriptResponse>({
                ...base, valid: false,
                error: { code: 'VALIDATION_UNAVAILABLE', message: 'Python and Ruby validation is not available yet' },
            })
        }
        const lines = body.code.split('\n')
        const badLine = lines.findIndex((line) => /ref\(\s*[^"\s)]/.test(line))
        if (badLine !== -1) {
            return HttpResponse.json<ValidateScriptResponse>({
                ...base, valid: false,
                error: { code: 'REF_NOT_LITERAL', message: 'ref() needs a string literal', line: badLine + 1, column: lines[badLine].indexOf('ref(') + 1 },
            })
        }
        const refs = extractRefs(body.code)
        return HttpResponse.json<ValidateScriptResponse>({
            valid: true,
            result: `mock result for ${JSON.stringify(body.testArguments)}`,
            resultJsonType: 'string',
            durationMs: 3,
            refs,
            warnings: refs.flatMap(({ ref, warning }) => (warning
                ? [{ code: warning, ref, line: lines.findIndex((line) => line.includes(ref)) + 1 }]
                : [])),
            error: null,
        })
    }),

    http.get(`${BASE}/:id`, ({ params }) => {
        const variable = findVariable(Number(params.id))
        return variable ? HttpResponse.json(toDetail(variable)) : notFound()
    }),

    http.post(BASE, async ({ request }) => {
        const dto = (await request.json()) as GlobalVariableSaveDto
        const error = validateSave(dto)
        if (error) return error
        const created = applySave(dto, undefined)
        db.variables = [...db.variables, created]
        logChange(created, { changeType: 'CREATE', versionFrom: null, versionTo: 1, oldValue: null, newValue: created.kind === 'SCRIPT' ? null : created.value, changedFields: null, restorable: false })
        return HttpResponse.json(toDetail(created))
    }),

    http.put(`${BASE}/:id`, async ({ params, request }) => {
        const previous = findVariable(Number(params.id))
        if (!previous) return notFound()
        const dto = (await request.json()) as GlobalVariableSaveDto
        if (dto.version !== previous.version) {
            return conflict({ code: 'VERSION_CONFLICT', message: `Changed by ${previous.updatedBy.name} at ${previous.updatedAt}`, currentVersion: previous.version, blocking: [] })
        }
        if (dto.kind !== previous.kind) return invalid('kind', 'KIND_CHANGE_NOT_ALLOWED', 'The kind can not change')
        if (dto.name !== previous.name && db.usages[previous.id]?.length) {
            return conflict({ code: 'IN_USE', message: 'Rename blocked while the variable is used', blocking: blockingUsages(previous) })
        }
        const error = validateSave(dto, previous.id)
        if (error) return error
        const updated = applySave(dto, previous)
        db.variables = db.variables.map((variable) => (variable.id === updated.id ? updated : variable))
        const valueChanged = updated.kind !== 'SCRIPT' && previous.kind !== 'SCRIPT' && JSON.stringify(updated.value) !== JSON.stringify(previous.value)
        logChange(updated, {
            changeType: valueChanged || updated.kind === 'SCRIPT' ? 'VALUE' : 'CONFIG',
            versionFrom: previous.version, versionTo: updated.version,
            oldValue: previous.kind === 'SCRIPT' ? previous.script.code : previous.value,
            newValue: updated.kind === 'SCRIPT' ? updated.script.code : updated.value,
            changedFields: null, restorable: valueChanged || updated.kind === 'SCRIPT',
        })
        return HttpResponse.json(toDetail(updated))
    }),

    http.delete(`${BASE}/:id`, ({ params }) => {
        const variable = findVariable(Number(params.id))
        if (!variable) return notFound()
        if (db.usages[variable.id]?.length) {
            return conflict({ code: 'IN_USE', message: 'The variable is still used', blocking: blockingUsages(variable) })
        }
        db.variables = db.variables.filter((item) => item.id !== variable.id)
        return new HttpResponse(null, { status: 204 })
    }),

    http.get(`${BASE}/:id/permissions`, ({ params }) => {
        const variable = findVariable(Number(params.id))
        if (!variable) return notFound()
        return HttpResponse.json({ ownerUser: variable.ownerUser, grants: db.grants[variable.id] ?? [], version: variable.version })
    }),

    http.put(`${BASE}/:id/permissions`, async ({ params, request }) => {
        const variable = findVariable(Number(params.id))
        if (!variable) return notFound()
        const dto = (await request.json()) as GlobalVariablePermissionsDto
        db.grants[variable.id] = dto.grants.map((grant) => ({ user: { id: grant.userId, name: `user ${grant.userId}` }, permissions: grant.permissions }))
        logChange(variable, { changeType: 'PERMISSIONS', versionFrom: variable.version, versionTo: variable.version, oldValue: null, newValue: null, changedFields: [{ field: 'permissions', old: null, new: null }], restorable: false })
        return HttpResponse.json({ ownerUser: variable.ownerUser, grants: db.grants[variable.id], version: variable.version })
    }),

    http.get(`${BASE}/:id/usage`, ({ params }) => HttpResponse.json(db.usages[Number(params.id)] ?? [])),

    http.get(`${BASE}/:id/changes`, ({ params, request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? 0)
        const size = Number(url.searchParams.get('size') ?? 20)
        const result = url.searchParams.get('result')
        const actorType = url.searchParams.get('actorType')
        const all = (db.changes[Number(params.id)] ?? [])
            .filter((change) => !result || change.result === result)
            .filter((change) => !actorType || change.actor.type === actorType)
        return HttpResponse.json({
            content: all.slice(page * size, page * size + size),
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(all.length / size)),
            totalItems: all.length,
        })
    }),

    http.post(`${BASE}/:id/restore/:changeId`, async ({ params, request }) => {
        const variable = findVariable(Number(params.id))
        const change = db.changes[Number(params.id)]?.find((item) => item.id === Number(params.changeId))
        if (!variable || !change) return notFound()
        const { version } = (await request.json()) as { version: number }
        if (version !== variable.version) {
            return conflict({ code: 'VERSION_CONFLICT', message: `Changed by ${variable.updatedBy.name} at ${variable.updatedAt}`, currentVersion: variable.version, blocking: [] })
        }
        const restored: GlobalVariable = variable.kind === 'SCRIPT'
            ? { ...variable, version: variable.version + 1, script: { ...variable.script, code: String(change.oldValue ?? variable.script.code) } }
            : { ...variable, version: variable.version + 1, value: change.oldValue }
        db.variables = db.variables.map((item) => (item.id === restored.id ? restored : item))
        logChange(restored, { changeType: 'RESTORE', versionFrom: variable.version, versionTo: restored.version, oldValue: variable.kind === 'SCRIPT' ? null : variable.value, newValue: change.oldValue, changedFields: null, restorable: true })
        return HttpResponse.json(toDetail(restored))
    }),

    http.post(`${BASE}/:id/impact`, async ({ params, request }) => {
        const variable = findVariable(Number(params.id))
        if (!variable) return notFound()
        const body = (await request.json()) as ImpactRequest
        const isDelete = 'delete' in body
        const isRename = !isDelete && body.name !== variable.name
        return HttpResponse.json({
            blocking: isDelete || isRename ? blockingUsages(variable) : [],
            warnings: (db.usages[variable.id] ?? [])
                .filter((usage) => usage.elementType === 'ENHANCEMENT')
                .map((usage) => ({ ...usage, reason: 'CALLS_IN_CODE_NOT_CHECKED' })),
        })
    }),
]
