import { useAuth } from '@features/auth/useAuth'
import { hasComponentPermission } from '@/engine/policy'

export function useScheduleUpdatePermission(): boolean {
    const { normalizedUser } = useAuth()
    return hasComponentPermission(normalizedUser?.permissions ?? [], 'SCHEDULE', 'UPDATE')
}
