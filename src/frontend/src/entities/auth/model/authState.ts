import type {AuthSession, AuthStatus} from "@entities/auth/model/types.ts";

export type AuthState = {
    status: AuthStatus
    session: AuthSession | null
    // True for one redirect cycle after an explicit user-initiated logout, so
    // AuthGuard can skip stamping `state.from` and land the user on / after
    // the next sign-in. Cleared by setSession or when LoginPage mounts.
    intentionalLogout: boolean
}
