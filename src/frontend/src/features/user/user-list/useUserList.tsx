import { useState } from 'react'
import {useGetUsersQuery} from "@entities/user/api/userApi.ts";

export function useUserList() {
    const [page, setPage] = useState(1)
    const [limit] = useState(4)

    const { data, isLoading } =
        useGetUsersQuery({ page, limit })
    return {
        users: data?.data ?? [],
        total: data?.total ?? 0,
        page,
        limit,
        setPage,
        isLoading,
    }
}
