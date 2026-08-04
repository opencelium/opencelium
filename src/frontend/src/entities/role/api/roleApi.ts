import { baseApi } from '@/shared/api/baseApi'
import type {Role} from "@entities/role/model/types.ts";
import {ROLE_TAG} from "@entities/role/api/role.tags.ts";

export const roleApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getRoles: b.query<
        Role[],
        { page: number; limit: number; search?: string }
    >({
      query: ({ page, limit, search }) =>
          `/role/all`,
      providesTags: (result) =>
          result
              ? [
                { type: ROLE_TAG, id: 'LIST' },
                ...result.map((u) => ({ type: ROLE_TAG, id: u.userId })),
              ]
              : [{ type: ROLE_TAG, id: 'LIST' }],
    }),
  }),
})

export const {
  useGetRolesQuery,
} = roleApi
