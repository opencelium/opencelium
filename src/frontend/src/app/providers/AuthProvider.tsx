import React, {useEffect, useMemo} from "react";
import {useAppDispatch} from "@shared/lib/storeHooks.ts";
import {authActions} from "@entities/auth/model/authSlice.ts";
import type {AuthMethod} from "@features/auth/resolveAuthStrategy.ts";
import {resolveAuthStrategy} from "@features/auth/resolveAuthStrategy.ts";
import {AuthService} from "@features/auth/AuthService.ts";
import AuthContext from "@features/auth/context/AuthContext.tsx";


interface AuthProviderProps {
    children: React.ReactNode
}
function resolveAuthMethod(): AuthMethod {
    return 'password'
}

export function AuthProvider({ children }: AuthProviderProps) {
    const dispatch = useAppDispatch();

    // 1. Hoist the method into a constant or useRef
    // so it isn't recomputed on every render
    const authMethod = useMemo(() => resolveAuthMethod(), []);

    // 2. Ensure the service is created exactly ONCE for the provider's lifetime
    const authService = useMemo(() => {
        const strategy = resolveAuthStrategy(authMethod);
        return new AuthService(strategy);
    }, [authMethod]);

    useEffect(() => {
        let isMounted = true; // Guard against race conditions

        const init = async () => {
            dispatch(authActions.setLoading());
            try {
                const session = await authService.refresh?.();
                if (isMounted) {
                    if (session) {
                        dispatch(authActions.setSession(session));
                    } else {
                        dispatch(authActions.clearSession());
                    }
                }
            } catch {
                if (isMounted) dispatch(authActions.clearSession());
            }
        };

        init();
        return () => { isMounted = false; };
    }, [authService, dispatch]); // authService is now stable

    return (
        <AuthContext.Provider value={authService}>
            {children}
        </AuthContext.Provider>
    );
}
