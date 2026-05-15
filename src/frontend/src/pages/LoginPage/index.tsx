import { Navigate } from 'react-router-dom'
import { useAuth } from '@features/auth/useAuth'
import { LoginForm } from '@features/auth/ui/LoginForm'

export default function LoginPage() {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) return <Navigate to="/" replace />

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
        }}>
            <LoginForm />
        </div>
    )
}
