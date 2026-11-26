import { Navigate } from 'react-router-dom'
import { useAuth } from '@features/auth/useAuth'
import { ForgotPasswordForm } from '@features/auth/ui/ForgotPasswordForm'
import { PublicPageLayout } from '@features/auth/ui/PublicPageLayout'

export default function ForgotPasswordPage() {
    const { isAuthenticated } = useAuth()
    if (isAuthenticated) return <Navigate to="/" replace />

    return (
        <PublicPageLayout>
            <ForgotPasswordForm />
        </PublicPageLayout>
    )
}
