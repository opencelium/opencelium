import type { AuthStrategy } from './AuthStrategy'
import type {AuthSession, LoginResult} from "@entities/auth/model/types.ts";

export class RealAuthStrategy implements AuthStrategy {
    async login(): Promise<LoginResult> {
        // fetch / axios
        throw new Error('Not implemented')
    }

    async logout(): Promise<void> {}

    async refresh(): Promise<AuthSession> {
        throw new Error('Not implemented')
    }
}
