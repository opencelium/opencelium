import { Navigate } from 'react-router-dom'
import { useAuth } from '@features/auth/useAuth'
import { LoginForm } from '@features/auth/ui/LoginForm'
import logoImage from '@assets/images/login_logo.png'

export default function LoginPage() {
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
