import type {AuthState} from "@entities/auth/model/authState.ts";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import type {AuthSession} from "@entities/auth/model/types.ts";

const initialState: AuthState = {
    status: 'loading',
    session: null,
    intentionalLogout: false,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setSession(state, action: PayloadAction<AuthSession>) {
            state.session = action.payload
            state.status = 'authenticated'
            state.intentionalLogout = false
        },
        clearSession(state, action: PayloadAction<{ intentional?: boolean } | undefined>) {
            state.session = null
            state.status = 'unauthenticated'
            state.intentionalLogout = action.payload?.intentional ?? false
        },
        setLoading(state) {
            state.status = 'loading'
        },
        clearIntentionalLogout(state) {
            state.intentionalLogout = false
        },
    },
})

export const authActions = authSlice.actions
export const authReducer = authSlice.reducer
