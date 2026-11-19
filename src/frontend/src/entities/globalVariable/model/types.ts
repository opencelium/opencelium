export type GlobalVariableKind = 'CONSTANT' | 'MUTABLE' | 'SCRIPT'
export type ScriptLanguage = 'js' | 'python2' | 'python3' | 'ruby'
export type ScopeType = 'ALL' | 'CATEGORIES' | 'WORKFLOWS'
export type WritePolicy = 'REPLACE' | 'FORWARD_ONLY' | 'INCREMENT'
export type PublishMode = 'ON_SUCCESS' | 'EACH_WRITE'
export type VariablePermission = 'VIEW_USE' | 'EDIT' | 'DELETE'
export type ScriptRefType = 'WEBHOOK' | 'REQUEST_DATA' | 'METHOD_RESPONSE' | 'PAGE' | 'GLOBAL'
export type UsageSourceType = 'WORKFLOW' | 'CONNECTOR' | 'NOTIFICATION' | 'SCRIPT_VARIABLE'
export type UsageElementType = 'METHOD' | 'OPERATOR' | 'ENHANCEMENT' | 'AGGREGATOR' | 'SET_STEP'
export type UsageAccess = 'READ' | 'WRITE' | 'CALL' | 'IMPORT' | 'REF'
export type ChangeType = 'CREATE' | 'VALUE' | 'CONFIG' | 'PERMISSIONS' | 'RESTORE' | 'DELETE'
export type ActorType = 'USER' | 'WORKFLOW'
export type ChangeResult = 'SAVED' | 'REJECTED'
export type ValueKind = 'REFERENCE' | 'LITERAL' | 'SCRIPT_CALL' | 'AGGREGATOR'
export type ImpactReason =
    | 'OUT_OF_SCOPE'
    | 'IN_USE'
    | 'PARAMETER_BREAKING'
    | 'REF_UNRESOLVED'
    | 'CALLS_IN_CODE_NOT_CHECKED'
    | 'IMPORTED_BY_SCRIPT'
export type ScriptWarningCode = 'TIED_TO_CALLER_COLORS'
export type ScriptErrorCode =
    | 'SCRIPT_SYNTAX'
    | 'SCRIPT_RUNTIME'
    | 'SCRIPT_TIMEOUT'
    | 'NO_RETURN_VALUE'
    | 'REF_NOT_LITERAL'
    | 'UNKNOWN_REF_TYPE'
    | 'UNKNOWN_IMPORT'
    | 'IMPORT_CYCLE'
    | 'IMPORT_LANGUAGE_MISMATCH'
    | 'VALIDATION_UNAVAILABLE'

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type NamedRef = { id: number; name: string }
export type WorkflowRef = { id: number; title: string }
export type ActorRef = { type: ActorType; id: number; name: string }
export type BeingUpdatedBy = { workflowId: number; executionId: number; startedAt: string }

export type PagedResponse<T> = {
    content: T[]
    currentPage: number
    totalPages: number
    totalItems: number
}

export type ScriptParameter = { name: string; required: boolean; default?: JsonValue | null }
export type ScriptRef = { ref: string; type: ScriptRefType; warning?: ScriptWarningCode }

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
    writePolicy: WritePolicy | null
    publishMode: PublishMode | null
    ownerWorkflow: WorkflowRef | null
    beingUpdatedBy: BeingUpdatedBy | null
    usageCount: number
    myPermissions: VariablePermission[]
    version: number
    updatedAt: string
    updatedBy: ActorRef
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
    ownerUser: NamedRef
    myPermissions: VariablePermission[]
    version: number
    createdAt: string
    createdBy: ActorRef
    updatedAt: string
    updatedBy: ActorRef
}

export type ScriptDefinition = {
    language: ScriptLanguage
    code: string
    parameters: ScriptParameter[]
    imports: string[]
}

export type ConstantVariable = GlobalVariableDetailBase & {
    kind: 'CONSTANT'
    value: JsonValue
    secret: boolean
    hasValue: boolean
}

export type MutableVariable = GlobalVariableDetailBase & {
    kind: 'MUTABLE'
    value: JsonValue
    writePolicy: WritePolicy
    publishMode: PublishMode
    ownerWorkflow: WorkflowRef | null
    beingUpdatedBy: BeingUpdatedBy | null
}

export type ScriptVariable = GlobalVariableDetailBase & {
    kind: 'SCRIPT'
    script: ScriptDefinition & { refs: ScriptRef[] }
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
    writePolicy: WritePolicy
    publishMode: PublishMode
    ownerWorkflowId: number | null
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
    value: JsonValue
    updatedAt: string
    updatedBy: ActorRef
    beingUpdatedBy: BeingUpdatedBy | null
}

export type UsageElement = {
    sourceType: UsageSourceType
    sourceId: number
    sourceTitle: string
    elementType?: UsageElementType
    elementLabel?: string
}

export type ImpactEntry = UsageElement & { reason: ImpactReason; ref?: string }
export type ImpactResult = { blocking: ImpactEntry[]; warnings: ImpactEntry[] }
export type ImpactRequest = GlobalVariableSaveDto | { delete: true }

export type GlobalVariableUsage = UsageElement & {
    access: UsageAccess
    color?: string
    index?: string
    field?: string
    arguments?: Record<string, string>
}

export type ProvenanceOrigin = {
    method: { color: string; name: string; index: string }
    part: 'REQUEST' | 'RESPONSE'
    section: 'BODY' | 'HEADER' | 'PATH'
    path: string
    connector: { id: number; title: string; invoker: string } | null
    share: number | null
}

export type ProvenanceSource = {
    workflow: {
        id: number
        title: string
        executionId: number
        trigger: 'SCHEDULE' | 'WEBHOOK' | 'MANUAL'
        startedBy: NamedRef | null
    }
    step: { type: 'SET_STEP' | 'AGGREGATOR'; index: string; label: string; loopPass: number | null }
    valueKind: ValueKind
    origins: ProvenanceOrigin[]
    aggregator?: NamedRef
}

export type ChangedField = { field: string; old: JsonValue; new: JsonValue }

export type ChangeActor =
    | { type: 'USER'; userId: number; userName: string }
    | { type: 'WORKFLOW'; workflowId: number; workflowTitle: string; schedulerId: number | null; executionId: number }

export type GlobalVariableChange = {
    id: number
    changeType: ChangeType
    versionFrom: number | null
    versionTo: number
    oldValue: JsonValue
    newValue: JsonValue
    writeCount: number | null
    changedFields: ChangedField[] | null
    actor: ChangeActor
    source: ProvenanceSource | null
    result: ChangeResult
    reason: string | null
    changedAt: string
    restorable: boolean
}

export type GlobalVariableChangesQuery = {
    page: number
    size: number
    result?: ChangeResult
    actorType?: ActorType
    workflowId?: number
    connectorId?: number
    methodColor?: string
    from?: string
    to?: string
}

type PickerItemBase = { name: string; description: string }

export type PickerItem =
    | (PickerItemBase & { kind: 'CONSTANT'; secret: boolean; valuePreview: string | null })
    | (PickerItemBase & {
          kind: 'MUTABLE'
          secret: boolean
          valuePreview: string | null
          ownerWorkflow: WorkflowRef | null
          writable: boolean
      })
    | (PickerItemBase & {
          kind: 'SCRIPT'
          language: ScriptLanguage
          parameters: ScriptParameter[]
          refs: ScriptRef[]
      })

export type PickerQuery =
    | { connectionId: number }
    | { categoryId: number }
    | { connectorId: number }
    | { schedulerId: number }

// Client-side only: places the contract gives no picker query for (a connector not saved yet,
// a notification template) can only rely on variables visible to every workflow.
export type PickerScope = PickerQuery | { allScope: true }

export type ValidateScriptRequest = ScriptDefinition & {
    testArguments: Record<string, JsonValue>
    testRefs: Record<string, JsonValue>
}

export type ScriptIssue = { code: ScriptErrorCode; message: string; line?: number; column?: number }
export type ScriptWarning = { code: ScriptWarningCode; ref: string; line?: number }

export type ValidateScriptResponse = {
    valid: boolean
    result: JsonValue
    resultJsonType: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'
    durationMs: number
    refs: ScriptRef[]
    warnings: ScriptWarning[]
    error: ScriptIssue | null
}

export type ViolationCode =
    | 'NAME_TAKEN'
    | 'NAME_INVALID'
    | 'VALUE_NOT_JSON'
    | 'VALUE_TOO_LARGE'
    | 'KIND_CHANGE_NOT_ALLOWED'
    | 'LANGUAGE_CHANGE_NOT_ALLOWED'
    | 'SECRET_NOT_ALLOWED_FOR_KIND'
    | 'POLICY_REQUIRED'
    | 'SCRIPT_SYNTAX'
    | 'REF_NOT_LITERAL'
    | 'IMPORT_CYCLE'
    | 'IMPORT_LANGUAGE_MISMATCH'

export type ConflictCode = 'VERSION_CONFLICT' | 'IN_USE' | 'SCOPE_NARROWING' | 'PARAMETER_BREAKING' | 'REF_UNRESOLVED'

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
