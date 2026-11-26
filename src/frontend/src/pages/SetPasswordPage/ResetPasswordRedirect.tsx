import { Navigate, useLocation } from 'react-router-dom'

// Backend installs default `opencelium.forgot-psw.base-url` to `/reset-password`,
// so emailed links land here; forward them with the `?token=` intact.
export function ResetPasswordRedirect() {
    const { search, hash } = useLocation()
    return <Navigate to={{ pathname: '/set-password', search, hash }} replace />
}
