export type GlobalVariableKind = 'CONSTANT' | 'MUTABLE' | 'SCRIPT'
export type ScriptLanguage = 'js' | 'python3' | 'ruby'
export type ScopeType = 'ALL' | 'CATEGORIES' | 'WORKFLOWS'
export type BusyPolicy = 'QUEUE' | 'REFUSE'
export type VariablePermission = 'VIEW_USE' | 'EDIT' | 'DELETE'
export type UsageSourceType = 'WORKFLOW' | 'CONNECTOR' | 'NOTIFICATION'
export type UsageElementType = 'METHOD' | 'OPERATOR' | 'ENHANCEMENT'
export type UsageAccess = 'READ' | 'WRITE' | 'IMPORT'
export type ChangeType = 'CREATE' | 'VALUE' | 'CONFIG' | 'PERMISSIONS' | 'RESTORE' | 'DELETE' | 'RESET' | 'RUN_WRITE'
export type ActorType = 'USER' | 'WORKFLOW'
export type ChangeResult = 'SAVED' | 'REJECTED'
export type ImpactReason = 'OUT_OF_SCOPE' | 'IN_USE' | 'PARAMETER_BREAKING' | 'CALLS_IN_CODE_NOT_CHECKED'
export type ScriptErrorCode =
    | 'SCRIPT_SYNTAX'
    | 'SCRIPT_RUNTIME'
    | 'SCRIPT_TIMEOUT'
    | 'NO_RETURN_VALUE'
    | 'SCRIPT_NOT_PURE'
    | 'PARAMETER_INVALID'
    | 'LANGUAGE_NOT_SUPPORTED'
    | 'MISSING_ARGUMENT'
    | 'SCRIPT_ENGINE_UNAVAILABLE'
    | 'VALIDATION_UNAVAILABLE'

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type NamedRef = { id: number; name: string }
export type WorkflowRef = { id: number; title: string }
// `name` is null once the workflow of a WORKFLOW actor is deleted.
export type ActorRef = { type: ActorType; id: number; name: string | null }
// `executionId` is null for a moment before the run's execution exists.
export type BeingUpdatedBy = { workflowId: number; executionId: number | null; startedAt: string }

export type PagedResponse<T> = {
    content: T[]
    currentPage: number
    totalPages: number
    totalItems: number
}

export type ScriptParameter = { name: string; description?: string | null; required: boolean; default?: JsonValue | null }

export type GlobalVariableScope = {
    type: ScopeType
    categories: NamedRef[]
    workflows: NamedRef[]
}

export type GlobalVariableScopeDto = {
    type: ScopeType
    categoryIds: number[]
    workflowIds: number[]
}

export type GlobalVariableListItem = {
    id: number
    name: string
    kind: GlobalVariableKind
    description: string
    secret: boolean
    valuePreview: string | null
    language: ScriptLanguage | null
    parameterCount: number | null
    scopeType: ScopeType
    beingUpdatedBy: BeingUpdatedBy | null
    usageCount: number
    myPermissions: VariablePermission[]
    version: number
    updatedAt: string | null
    updatedBy: ActorRef | null
}

export type GlobalVariableListQuery = {
    page: number
    size: number
    sort?: string
    search?: string
    kind?: GlobalVariableKind
}

type GlobalVariableDetailBase = {
    id: number
    name: string
    description: string
    scope: GlobalVariableScope
    ownerUser: NamedRef | null
    myPermissions: VariablePermission[]
    version: number
    createdAt: string
    createdBy: ActorRef | null
    updatedAt: string | null
    updatedBy: ActorRef | null
}

export type ScriptDefinition = {
    language: ScriptLanguage
    code: string
    parameters: ScriptParameter[]
}

export type ConstantVariable = GlobalVariableDetailBase & {
    kind: 'CONSTANT'
    value: JsonValue
    secret: boolean
    hasValue: boolean
}

export type MutableState = {
    currentValue: JsonValue
    revision: number
    setAt: string | null
    setBy: ActorRef | null
    setByExecutionId: number | null
    busyPolicy: BusyPolicy
    ownerWorkflow: WorkflowRef | null
}

// `value` is the initial value a reset goes back to; the value runs read and write is `mutable.currentValue`.
export type MutableVariable = GlobalVariableDetailBase & {
    kind: 'MUTABLE'
    value: JsonValue
    mutable: MutableState
}

export type ScriptVariable = GlobalVariableDetailBase & {
    kind: 'SCRIPT'
    script: ScriptDefinition
}

export type GlobalVariable = ConstantVariable | MutableVariable | ScriptVariable

type GlobalVariableSaveBase = {
    name: string
    description: string
    scope: GlobalVariableScopeDto
    version?: number
}

// A secret constant keeps its stored value on PUT when `value` is left out.
export type ConstantSaveDto = GlobalVariableSaveBase & { kind: 'CONSTANT'; value?: JsonValue; secret: boolean }
export type MutableSaveDto = GlobalVariableSaveBase & {
    kind: 'MUTABLE'
    value: JsonValue
    busyPolicy: BusyPolicy
    ownerWorkflowId: number
}
export type ScriptSaveDto = GlobalVariableSaveBase & { kind: 'SCRIPT'; script: ScriptDefinition }

export type GlobalVariableSaveDto = ConstantSaveDto | MutableSaveDto | ScriptSaveDto

export type PermissionGrant = { user: NamedRef; permissions: VariablePermission[] }
export type GlobalVariablePermissions = { ownerUser: NamedRef; grants: PermissionGrant[]; version: number }
export type GlobalVariablePermissionsDto = {
    grants: { userId: number; permissions: VariablePermission[] }[]
    version: number
}

export type GlobalVariableValue = {
    id: number
    version: number
    revision: number
    value: JsonValue
    updatedAt: string | null
    // null when a run wrote the current value
    updatedBy: ActorRef | null
    beingUpdatedBy: BeingUpdatedBy | null
}

export type UsageElement = {
    sourceType: UsageSourceType
    sourceId: number
    sourceTitle: string
    elementType?: UsageElementType
    elementLabel?: string
}

export type ImpactEntry = UsageElement & {
    reason: ImpactReason
    color?: string | null
    index?: string | null
    field?: string | null
    parameter?: string
}
export type ImpactResult = { blocking: ImpactEntry[]; warnings: ImpactEntry[] }
export type ImpactRequest = GlobalVariableSaveDto | { delete: true }

export type GlobalVariableUsage = UsageElement & {
    access: UsageAccess
    color?: string
    index?: string
    field?: string
}

export type ChangedField = { field: string; old: JsonValue; new: JsonValue }

export type GlobalVariableChange = {
    id: number
    changeType: ChangeType
    versionFrom: number | null
    versionTo: number | null
    oldValue: JsonValue
    newValue: JsonValue
    writeCount: number | null
    changedFields: ChangedField[] | null
    actor: ActorRef | null
    executionId: number | null
    result: ChangeResult
    reason: string | null
    changedAt: string
    restorable: boolean
}

export type GlobalVariableChangesQuery = { page: number; size: number }

type PickerItemBase = { name: string; description: string }

export type PickerItem =
    | (PickerItemBase & { kind: 'CONSTANT'; secret: boolean; valuePreview: string | null })
    // `writable`: the picker's workflow is the owner, so it may write the variable.
    | (PickerItemBase & {
          kind: 'MUTABLE'
          secret: boolean
          valuePreview: string | null
          ownerWorkflow: WorkflowRef | null
          writable: boolean
      })
    | (PickerItemBase & { kind: 'SCRIPT'; language: ScriptLanguage; parameters: ScriptParameter[] })

export type PickerQuery =
    | { connectionId: number }
    | { categoryId: number }
    | { connectorId: number }
    | { schedulerId: number }

// Client-side only: places the contract gives no picker query for (a connector not saved yet,
// a notification template) can only rely on variables visible to every workflow.
export type PickerScope = PickerQuery | { allScope: true }

// `testArguments` follow the order of `parameters`; trailing ones left out take their defaults.
export type ValidateScriptRequest = ScriptDefinition & { name?: string; testArguments: JsonValue[] }

export type ScriptIssue = { code: ScriptErrorCode; message: string; line?: number | null; column?: number | null }

export type ValidateScriptResponse = {
    valid: boolean
    result: JsonValue
    resultJsonType: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | null
    durationMs: number | null
    error: ScriptIssue | null
}

export type ViolationCode =
    | 'NAME_INVALID'
    | 'NAME_TAKEN'
    | 'KIND_REQUIRED'
    | 'KIND_CHANGE_NOT_ALLOWED'
    | 'DESCRIPTION_TOO_LONG'
    | 'VALUE_TOO_LARGE'
    | 'SECRET_REMOVAL_NEEDS_VALUE'
    | 'SCOPE_REQUIRED'
    | 'SCOPE_INVALID'
    | 'VERSION_REQUIRED'
    | 'GRANT_INVALID'
    | 'SCRIPT_HAS_NO_VALUE'
    | 'NOT_RESTORABLE'
    | 'OWNER_WORKFLOW_REQUIRED'
    | 'OWNER_WORKFLOW_INVALID'
    | 'MUTABLE_ONLY'
    | 'SECRET_NOT_ALLOWED'
    | 'NOT_MUTABLE'
    | 'SCRIPT_REQUIRED'
    | 'SCRIPT_ONLY'
    | 'LANGUAGE_NOT_SUPPORTED'
    | 'LANGUAGE_CHANGE_NOT_ALLOWED'
    | 'SCRIPT_SYNTAX'
    | 'NO_RETURN_VALUE'
    | 'SCRIPT_NOT_PURE'
    | 'PARAMETER_INVALID'

export type ConflictCode = 'VERSION_CONFLICT' | 'IN_USE' | 'SCOPE_NARROWING' | 'PARAMETER_BREAKING' | 'BUSY'

export type GlobalVariableValidationError = {
    timestamp: string
    status: 400
    error: 'GLOBAL_VARIABLE_INVALID'
    message: string
    path: string
    violations: { field: string; code: ViolationCode; message: string }[]
}

export type GlobalVariableConflictError = {
    status: 409
    error: 'GLOBAL_VARIABLE_CONFLICT'
    code: ConflictCode
    message: string
    currentVersion?: number
    blocking: ImpactEntry[]
}
