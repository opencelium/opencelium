import type {AuthStrategy} from "@features/auth/strategies/AuthStrategy.ts";

export class AuthService {
    constructor(private strategy: AuthStrategy) {}

    login(payload?: unknown) {
        return this.strategy.login(payload)
    }

    logout() {
        return this.strategy.logout()
    }

    refresh() {
        return this.strategy.refresh?.()
    }
}
