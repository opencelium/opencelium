import {useNavigate} from 'react-router-dom'
import {useAuth} from '@features/auth/useAuth'
import {hasComponentPermission} from '@/engine/policy'

const PROFILE_ROUTE = '/profile'

export const useUserProfile = () => {
    const navigate = useNavigate()
    const {user, normalizedUser} = useAuth()
    const detail = user?.userDetail
    const fullName = [detail?.name, detail?.surname].filter(Boolean).join(' ')

    return {
        profilePicture: detail?.profilePicture ?? null,
        displayName: fullName || user?.username || user?.email || '',
        canReadProfile: hasComponentPermission(normalizedUser?.permissions ?? [], 'MYPROFILE', 'READ'),
        openProfile: () => navigate(PROFILE_ROUTE),
    }
}
