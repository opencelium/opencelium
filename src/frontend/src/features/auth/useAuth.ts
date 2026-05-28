import { useContext } from 'react'
import { useAppDispatch, useAppSelector } from '@/shared/lib/storeHooks'
import {
  selectAuthUser,
  selectIsAuthenticated,
  selectIsAuthLoading, selectNormalizedAuthUser,
} from '@/entities/auth/model/authSelectors'
import { authActions } from '@/entities/auth/model/authSlice'
import AuthContext from './context/AuthContext'
import type {AuthUser, LoginResult, TotpValidateInput} from "@entities/auth/model/types.ts";
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

    login: async (payload?: unknown): Promise<LoginResult> => {
      // Intentionally not dispatching setLoading here: the auth slice's 'loading'
      // status is reserved for the initial refresh-on-mount path that AuthBootstrap
      // gates rendering on. The submit-button spinner is driven by LoginForm's own
      // local isSubmitting state, which keeps the user on the login page while the
      // request is in flight and lets the error path render inline.
      const result = await auth.login(payload)
      // A 2FA-enabled account stops here with a challenge; the caller opens the TOTP
      // dialog and only the second step (validateTotp) produces a session.
      if (result.status === 'authenticated') {
        dispatch(authActions.setSession(result.session))
      }
      return result
    },

    validateTotp: async (input: TotpValidateInput) => {
      const session = await auth.validateTotp(input)
      dispatch(authActions.setSession(session))
    },

    logout: async () => {
      await auth.logout()
      dispatch(authActions.clearSession({ intentional: true }))
    },
  }
}
