import type {AuthSession, AuthStatus} from "@entities/auth/model/types.ts";

export type AuthState = {
    status: AuthStatus
    session: AuthSession | null
}
