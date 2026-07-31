import { useAuth } from '@/features/auth/useAuth'
import { LoadingScreen } from '@/shared/ui/feedback/LoadingScreen'

export function AuthBootstrap({ children }) {
    const { isLoading } = useAuth()
    if (isLoading) return <LoadingScreen />
    return children
}
