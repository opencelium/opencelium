export type Mode = 'create' | 'update' | 'view' | 'delete' | string

export type AccessStrategy =
    | 'allow'
    | 'hide'
    | 'disable'
    | 'forbid'

export type PolicyEffect = 'allow' | 'deny'

export type PolicyRule = {

    //PBAC
    modes?: Mode[] //You can restrict specific actions (create, delete) independently of the resource.
    effect: PolicyEffect //An explicit deny that overrides all allows is a standard security pattern (Explicit Deny).

    /**
     * For RBAC
     */
    roles?: string[]
    permissions?: string[]

    /**
     * For ABAC
     * For example: owner-only logic
     */
    condition?: (ctx: PolicyContext) => boolean //Lets you write dynamic rules (time of day, record status, department membership).
    /**
     * For custom resolvers
     */
    resolver?: string //Lets you move complex logic (e.g. a DB query or third-party service call) out of the policy definition into a named plugin.

    priority?: number
}

export type PolicyDefinition = {
    /**
     * What to do when access is denied
     */
    strategy?: AccessStrategy

    rules: PolicyRule[]
}

export type AccessDecision = {
    allowed: boolean
    strategy: AccessStrategy
    matchedRule?: PolicyRule
}

export type PolicyContextUser = {
    id: number
    roles: string[]
    permissions: string[]
    attributes?: Record<string, unknown>
}

/**
 * Policy evaluation context
 */
export type PolicyContext = {
    user: PolicyContextUser

    mode?: Mode
    entity?: string
    record?: any
    resource?: string
}
