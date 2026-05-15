import { useContext } from 'react'
import { useAppDispatch, useAppSelector } from '@/shared/lib/storeHooks'
import {
  selectAuthUser,
  selectIsAuthenticated,
  selectIsAuthLoading, selectNormalizedAuthUser,
} from '@/entities/auth/model/authSelectors'
import { authActions } from '@/entities/auth/model/authSlice'
import AuthContext from './context/AuthContext'
import type {AuthUser} from "@entities/auth/model/types.ts";
import type {NormalizedUser} from "@features/auth/types.ts";

export function useAuth() {
  const auth = useContext(AuthContext)
  const dispatch = useAppDispatch()

  const user: AuthUser = useAppSelector(selectAuthUser)
  const normalizedUser: NormalizedUser = useAppSelector(selectNormalizedAuthUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isLoading = useAppSelector(selectIsAuthLoading)

  if (!auth) {
    throw new Error('AuthProvider missing')
  }

  return {
    user,
    normalizedUser,
    isAuthenticated,
    isLoading,

    login: async (payload?: unknown) => {
      dispatch(authActions.setLoading())
      const session = await auth.login(payload)
      dispatch(authActions.setSession(session))
    },

    logout: async () => {
      await auth.logout()
      dispatch(authActions.clearSession())
    },
  }
}
