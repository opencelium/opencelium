import { Navigate } from 'react-router-dom'
import { useAuth } from '@features/auth/useAuth'
import { OidcCallback } from '@features/auth/ui/OidcCallback'
import { AppLogo } from '@features/branding/AppLogo'

export default function OidcCallbackPage() {
    const { isAuthenticated } = useAuth()

    // Reactive, like LoginPage: as soon as the exchange (or the TOTP step) puts the session in
    // Redux there is nothing left to do on this screen.
    if (isAuthenticated) return <Navigate to="/" replace />

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
                <AppLogo />
                <OidcCallback />
            </div>
        </div>
    )
}
