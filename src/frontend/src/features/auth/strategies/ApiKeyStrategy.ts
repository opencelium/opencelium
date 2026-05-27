import { AuthStrategy } from './AuthStrategy'
import { AuthSession, LoginResult } from '@/entities/auth/model/types'

export class ApiKeyStrategy
    implements AuthStrategy<{ apiKey: string }>
{
    constructor(private readonly storageKey = 'api_key') {}

    async login({ apiKey }: { apiKey: string }): Promise<LoginResult> {
        const res = await fetch('/auth/api-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey,
            },
        })

        if (!res.ok) {
            throw new Error('Invalid API key')
        }

        const session = (await res.json()) as AuthSession

        // API key can live for a long time — persist it
        localStorage.setItem(this.storageKey, apiKey)

        return { status: 'authenticated', session }
    }

    async refresh(): Promise<AuthSession | null> {
        const apiKey = localStorage.getItem(this.storageKey)
        if (!apiKey) return null

        const res = await fetch('/auth/api-key/validate', {
            headers: {
                'X-API-KEY': apiKey,
            },
        })

        if (!res.ok) {
            localStorage.removeItem(this.storageKey)
            return null
        }

        return res.json()
    }

    async logout(): Promise<void> {
        localStorage.removeItem(this.storageKey)
    }
}
