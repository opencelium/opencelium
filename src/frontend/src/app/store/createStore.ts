import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '@/shared/api/baseApi'
import {authReducer} from '@/entities/auth/model/authSlice'
import type {RootState} from "@app/store/types.ts";

export function createStore(preloadedState?: Partial<RootState>) {
    return configureStore({
        reducer: {
            [baseApi.reducerPath]: baseApi.reducer,
            auth: authReducer,
        },
        middleware: (gdm) =>
            gdm().concat(baseApi.middleware),
        preloadedState,
    })
}
