import {PasswordStrategy} from "@features/auth/strategies/PasswordStrategy.ts";
import {OAuthStrategy} from "@features/auth/strategies/OAuthStrategy.ts";
import {ApiKeyStrategy} from "@features/auth/strategies/ApiKeyStrategy.ts";

export type AuthMethod = 'password' | 'oauth' | 'apiKey' | 'mock'

export function resolveAuthStrategy(method: AuthMethod) {
    switch (method) {
        case 'password':
            return new PasswordStrategy()
        case 'oauth':
            return new OAuthStrategy()
        case 'apiKey':
            return new ApiKeyStrategy()
        default:
            throw new Error('Unknown auth method')
    }
}
