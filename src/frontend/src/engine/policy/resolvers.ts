import { PolicyContext } from './types'

export type PolicyResolver = (ctx: PolicyContext) => boolean

class ResolverRegistry {
    private resolvers = new Map<string, PolicyResolver>()

    register(key: string, resolver: PolicyResolver) {
        this.resolvers.set(key, resolver)
    }

    get(key: string): PolicyResolver | undefined {
        return this.resolvers.get(key)
    }

    has(key: string) {
        return this.resolvers.has(key)
    }
}

export const policyResolverRegistry = new ResolverRegistry()

/**
 * Example of a built-in resolver
 */
policyResolverRegistry.register('owner', (ctx) => {
    if (!ctx.record) return false
    return ctx.record.ownerId === ctx.user.id
})
