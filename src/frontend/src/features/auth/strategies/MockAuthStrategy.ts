import type { AuthStrategy } from "./AuthStrategy";
import type {AuthSession, LoginResult} from "@entities/auth/model/types.ts";

export type MockLoginPayload = {
    role: 'admin' | 'reporter' | 'user';
};

export class MockAuthStrategy implements AuthStrategy<MockLoginPayload> {
    async login(payload: MockLoginPayload): Promise<LoginResult> {
        //await new Promise(res => setTimeout(res, 500));
        // Send a request to the same endpoint, but with the mock flag
        const res = await fetch('/auth/mock-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error('Mock login failed');
        }

        const session = (await res.json()) as AuthSession // Returns an AuthSession with the requested role
        return { status: 'authenticated', session }
    }

    async refresh(): Promise<AuthSession | null> {
        try {
            const res = await fetch('/auth/refresh', {
                method: 'GET', // or POST, depending on preference
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                // If the session has expired or doesn't exist — return null
                return null;
            }

            return await res.json();
        } catch (error) {
            console.error('Refresh failed:', error);
            return null;
        }
    }

    async logout() {
        await fetch('/auth/logout', { method: 'POST' });
    }
}
