import type {RootState} from "@app/store/types.ts";


export const selectAuthState = (state: RootState) => state.auth

export const selectAuthSession = (state: RootState) =>
    state.auth.session

export const selectAccessToken = (state: RootState) =>
    state.auth.session?.accessToken ?? null

export const selectAuthUser = (state: RootState) =>
    state.auth.session?.user ?? null

export const selectNormalizedAuthUser = (state: RootState) =>
    state.auth.session?.normalizedUser ?? null

export const selectAuthStatus = (state: RootState) =>
    state.auth.status

export const selectIsAuthenticated = (state: RootState) =>
    state.auth.status === 'authenticated'

export const selectIsAuthLoading = (state: RootState) =>
    state.auth.status === 'loading'
