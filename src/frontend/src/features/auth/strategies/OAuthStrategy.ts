import type {AuthStrategy} from "@features/auth/strategies/AuthStrategy.ts";
import type {AuthSession, LoginResult} from "@entities/auth/model/types.ts";

export class OAuthStrategy implements AuthStrategy<void> {
    async login(): Promise<LoginResult> {
        window.location.href = '/auth/oauth/redirect'
        throw new Error('OAuth redirect')
    }

    async refresh(): Promise<AuthSession | null> {
        const res = await fetch('/auth/oauth/session')
        if (!res.ok) return null
        return res.json()
    }

    async logout(): Promise<void> {
        await fetch('/auth/logout')
    }
}
