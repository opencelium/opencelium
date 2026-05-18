import { Navigate, Outlet } from 'react-router-dom'
import {useAuth} from "@features/auth/useAuth.ts";

export function AuthGuard() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) return null
    if (!isAuthenticated) return <Navigate to="/login" replace />

    return <Outlet />
}
