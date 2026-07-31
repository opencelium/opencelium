// strategies.ts

import { AccessStrategy } from './types'

export const defaultAllowStrategy: AccessStrategy = 'allow'
export const defaultDenyStrategy: AccessStrategy = 'hide'

export function resolveStrategy(
    policyStrategy: AccessStrategy | undefined,
    isDenied: boolean
): AccessStrategy {
    if (!isDenied) {
        return policyStrategy ?? defaultAllowStrategy
    }

    return policyStrategy ?? defaultDenyStrategy
}
