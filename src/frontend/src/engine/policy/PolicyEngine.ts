import {
    PolicyDefinition,
    PolicyContext,
    AccessDecision,
    PolicyRule,
} from './types'
import { resolveStrategy } from './strategies'
import { policyResolverRegistry } from './resolvers'

export class PolicyEngine {

    evaluate(
        policy: PolicyDefinition | undefined,
        ctx: PolicyContext
    ): AccessDecision {

        // No policy — full access
        if (!policy) {
            return {
                allowed: true,
                strategy: 'allow'
            }
        }

        const rules = [...policy.rules].sort(
            (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
        )
        let matchedAllow: PolicyRule | undefined

        for (const rule of rules) {

            if (!this.matchesRule(rule, ctx)) {
                continue
            }

            // deny always takes priority
            if (rule.effect === 'deny') {
                return {
                    allowed: false,
                    strategy: resolveStrategy(policy.strategy, true),
                    matchedRule: rule
                }
            }

            if (rule.effect === 'allow') {
                matchedAllow = rule
            }
        }

        if (matchedAllow) {
            return {
                allowed: true,
                strategy: resolveStrategy(policy.strategy, false),
                matchedRule: matchedAllow
            }
        }

        // If no allow rule matched — access is denied
        return {
            allowed: false,
            strategy: resolveStrategy(policy.strategy, true)
        }
    }

    private matchesRule(
        rule: PolicyRule,
        ctx: PolicyContext
    ): boolean {

        const { user, mode } = ctx

        // --- MODE ---
        if (rule.modes && rule.modes.length > 0) {
            if (!mode || !rule.modes.includes(mode)) {
                return false
            }
        }

        // --- ROLES ---
        if (rule.roles && rule.roles.length > 0) {
            const hasRole = rule.roles.some(r =>
                user.roles.includes(r)
            )
            if (!hasRole) return false
        }

        // --- PERMISSIONS ---
        if (rule.permissions && rule.permissions.length > 0) {
            const hasPermission = rule.permissions.some(p =>
                user.permissions.includes(p)
            )
            if (!hasPermission) return false
        }

        // --- CONDITION (ABAC) ---
        if (rule.condition) {
            try {
                if (!rule.condition(ctx)) return false
            } catch {
                return false // safe fallback
            }
        }

        // --- RESOLVER (PBAC) ---
        if (rule.resolver) {
            const resolver = policyResolverRegistry.get(rule.resolver)

            if (!resolver) return false

            try {
                if (!resolver(ctx)) return false
            } catch {
                return false
            }
        }

        return true
    }
}

// policySingleton.ts
export const policyEngine = new PolicyEngine()
