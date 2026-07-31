import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { useAuth } from '@features/auth/useAuth'
import { LoginForm } from '@features/auth/ui/LoginForm'
import logoImage from '@assets/images/login_logo.png'
import { useAppDispatch, useAppSelector } from '@shared/lib/storeHooks'
import { selectIntentionalLogout } from '@entities/auth/model/authSelectors'
import { authActions } from '@entities/auth/model/authSlice'

export default function LoginPage() {
    const { isAuthenticated } = useAuth()
    const location = useLocation()
    const dispatch = useAppDispatch()
    const intentionalLogout = useAppSelector(selectIntentionalLogout)
    const from = (location.state as { from?: Location } | null)?.from
    const redirectTo = from ? `${from.pathname}${from.search}${from.hash}` : '/'

    // The intentional-logout flag served its purpose the moment AuthGuard
    // redirected here without a `from`. Clear it so a subsequent attempt to
    // visit a protected URL while still signed-out captures `from` normally.
    useEffect(() => {
        if (intentionalLogout) dispatch(authActions.clearIntentionalLogout())
    }, [intentionalLogout, dispatch])

    if (isAuthenticated) return <Navigate to={redirectTo} replace />

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 16,
                background: 'var(--color-background-app)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 24,
                }}
            >
                <img
                    src={logoImage}
                    alt="OpenCelium"
                    style={{ height: 56, width: 'auto' }}
                />
                <LoginForm />
            </div>
        </div>
    )
}
