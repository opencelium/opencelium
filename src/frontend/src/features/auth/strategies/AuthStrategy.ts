import type { AuthSession, LoginResult, TotpValidateInput } from "@/entities/auth/model/types"


export interface AuthStrategy<TPayload = unknown> {
    login(payload: TPayload): Promise<LoginResult>
    logout(): Promise<void>
    refresh?(): Promise<AuthSession | null>
    /** Second step of a two-factor login: exchange the authenticator code for a session. */
    validateTotp?(input: TotpValidateInput): Promise<AuthSession>
}
