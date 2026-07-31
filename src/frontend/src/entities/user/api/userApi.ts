import { baseApi } from '@/shared/api/baseApi'
import type { User } from '../model/types';
import type { AuthUser } from '@entities/auth/model/types'
import {USER_TAG} from "@entities/user/api/user.tags.ts";

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type UpdateProfilePayload = Pick<AuthUser, 'email'> & {
  userDetail: Partial<AuthUser['userDetail']>
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getUsers: b.query<
        User[],
        { page: number; limit: number; search?: string }
    >({
      query: ({ page, limit, search }) =>
          //`/users?page=${page}&limit=${limit}&search=${search ?? ''}`,
          `/user/all`,
      providesTags: (result) =>
          result
              ? [
                { type: USER_TAG, id: 'LIST' },
                ...result.map((u) => ({ type: USER_TAG, id: u.userId })),
              ]
              : [{ type: USER_TAG, id: 'LIST' }],
    }),
    updateProfile: b.mutation<AuthUser, { identifier: string; body: UpdateProfilePayload }>({
      query: ({ identifier, body }) => ({
        url: `/user/${identifier}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: USER_TAG, id: 'LIST' },
        { type: USER_TAG, id: arg.identifier },
      ],
    }),
    changePassword: b.mutation<void, ChangePasswordPayload>({
      query: (body) => ({
        url: `/user/change-password`,
        method: 'POST',
        body,
      }),
      extraOptions: { ignoreError: true },
    }),
  }),
})

export const {
  useGetUsersQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = userApi
