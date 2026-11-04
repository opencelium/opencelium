import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { useClearMasterPasswordOnSignOut } from '@features/master-password'
import { LoadingScreen } from '@/shared/ui/feedback/LoadingScreen'

export function AuthBootstrap({ children }: { children: ReactNode }) {
    const { isLoading } = useAuth()
    useClearMasterPasswordOnSignOut()
    if (isLoading) return <LoadingScreen />
    return children
}
