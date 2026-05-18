import type {AuthState} from "@entities/auth/model/authState.ts";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import type {AuthSession} from "@entities/auth/model/types.ts";

const initialState: AuthState = {
    status: 'loading',
    session: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setSession(state, action: PayloadAction<AuthSession>) {
            state.session = action.payload
            state.status = 'authenticated'
        },
        clearSession(state) {
            state.session = null
            state.status = 'unauthenticated'
        },
        setLoading(state) {
            state.status = 'loading'
        },
    },
})

export const authActions = authSlice.actions
export const authReducer = authSlice.reducer
