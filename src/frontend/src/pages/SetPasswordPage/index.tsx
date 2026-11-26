import { Navigate } from 'react-router-dom'
import { SetPasswordForm } from '@features/auth/ui/SetPasswordForm'
import { PublicPageLayout } from '@features/auth/ui/PublicPageLayout'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { useSignOutForReset } from './useSignOutForReset'

export default function SetPasswordPage() {
    const entry = useSignOutForReset()
    if (entry === 'nothingToReset') return <Navigate to="/" replace />

    return (
        <PublicPageLayout>
            {entry === 'signingOut' ? <Loading size="md" /> : <SetPasswordForm />}
        </PublicPageLayout>
    )
}
