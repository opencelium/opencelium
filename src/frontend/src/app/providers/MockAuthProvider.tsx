
import AuthContext from "@features/auth/context/AuthContext.tsx";
import { AuthService } from '@/features/auth/AuthService'
import { MockAuthStrategy } from '@/features/auth/strategies/MockAuthStrategy'
import React from "react";

interface Props {
    children: React.ReactNode
}

export function MockAuthProvider({ children }: Props) {
    const authService = new AuthService(new MockAuthStrategy())

    return (
        <AuthContext.Provider value={authService}>
            {children}
        </AuthContext.Provider>
    )
}
