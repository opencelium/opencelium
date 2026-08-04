import type {AuthStrategy} from "@features/auth/strategies/AuthStrategy.ts";
import type {TotpValidateInput} from "@entities/auth/model/types.ts";

export class AuthService {
    constructor(private strategy: AuthStrategy) {}

    login(payload?: unknown) {
        return this.strategy.login(payload)
    }

    validateTotp(input: TotpValidateInput) {
        if (!this.strategy.validateTotp) {
            throw new Error('The active auth strategy does not support TOTP validation')
        }
        return this.strategy.validateTotp(input)
    }

    logout() {
        return this.strategy.logout()
    }

    refresh() {
        return this.strategy.refresh?.()
    }
}
