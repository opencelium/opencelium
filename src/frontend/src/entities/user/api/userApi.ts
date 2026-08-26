import { baseApi } from '@/shared/api/baseApi'
import type { User } from '../model/types';
import type { AuthUser } from '@entities/auth/model/types'
import {USER_TAG} from "@entities/user/api/user.tags.ts";

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type UpdateProfilePayload = Pick<AuthUser, 'email' | 'username'> & {
  userDetail: Partial<AuthUser['userDetail']>
}

/**
 * PUT /user/{id} is a full replace, not a patch: the backend rebuilds the record
 * from the body, so every field has to be sent. `userGroup` is an int there — a
 * missing one deserializes to 0, finds no role and clears the user's group.
 * `password` is the one safe omission (the service keeps the stored hash when it
 * is absent or empty).
 */
export type UserUpdateRequestDTO = Pick<AuthUser, 'userId' | 'email' | 'username'> & {
  userGroup: number
  userDetail: AuthUser['userDetail']
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
    /** The response echoes the *request* resource back (flat `userGroup`, no
     * widgetSettings), so it must not be fed into the auth session — callers
     * update their own copy of the user instead. */
    updateUser: b.mutation<void, { userId: number; body: UserUpdateRequestDTO }>({
      query: ({ userId, body }) => ({
        url: `/user/${userId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: USER_TAG, id: 'LIST' },
        { type: USER_TAG, id: arg.userId },
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
  useUpdateUserMutation,
  useChangePasswordMutation,
} = userApi
