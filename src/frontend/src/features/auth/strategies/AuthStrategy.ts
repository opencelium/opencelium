import type { AuthSession } from "@/entities/auth/model/types"


export interface AuthStrategy<TPayload = unknown> {
    login(payload: TPayload): Promise<AuthSession>
    logout(): Promise<void>
    refresh?(): Promise<AuthSession | null>
}
