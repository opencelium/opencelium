import { useGetUsersQuery } from '../api/userApi'
import type { User } from './types.ts'

type UseUsersResult = {
    users: User[]
    isLoading: boolean
    isError: boolean
}

export function useUsers(
    params: { page: number; limit: number },
): UseUsersResult {
    const { data, isLoading, isError } =
        useGetUsersQuery(params)

    return {
        users: data ?? [],
        isLoading,
        isError,
    }
}
export function useUserTable(
    params: { page: number; limit: number },
) {
    const { users, isLoading } = useUsers(params)

    return {
        data: users,
        isLoading,
    }
}
