import { Navigate } from 'react-router-dom'
import { useAuth } from '@features/auth/useAuth'
import { SetPasswordForm } from '@features/auth/ui/SetPasswordForm'
import { AppLogo } from '@features/branding/AppLogo'

export default function SetPasswordPage() {
    const { isAuthenticated } = useAuth()
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
                <SetPasswordForm />
            </div>
        </div>
    )
}
