import { BaseQueryFn, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { normalizeError } from '@shared/errors/api/normalizeError.ts'
import { errorBus } from '@shared/errors/api/errorBus.ts'
import { selectAccessToken } from '@entities/auth/model/authSelectors'
import type { RootState } from '@app/store/types'

const rawBaseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState, extra }) => {
        if (!headers.has('content-type')) {
            headers.set('content-type', 'application/json')
        }

        const token = selectAccessToken(getState() as RootState)
        if (token) {
            headers.set('authorization', `Bearer ${token}`)
        }

        if (extra?.headers) {
            Object.entries(extra.headers).forEach(([key, value]) => {
                headers.set(key, value)
            })
        }
        return headers
    },
})

type CustomFetchArgs = FetchArgs & {
    customOptions?: {
        ignoreError?: boolean
    }
}
type ExtraOptions = {
    ignoreError?: boolean
    headers?: Record<string, string>
}

export const baseQuery: BaseQueryFn<
    string | CustomFetchArgs,
    unknown,
    FetchBaseQueryError,
    ExtraOptions
> = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(
        args,
        {
            ...api,
            extra: {
                ...api.extra,
                headers: args?.customOptions?.headers,
            },
        },
        extraOptions
    )

    const ignoreErrorFromArgs =
        typeof args !== 'string' && args.customOptions?.ignoreError

    if (!extraOptions?.ignoreError && !ignoreErrorFromArgs && result.error) {
        const appError = normalizeError(result.error)
        errorBus.emit(appError)
    }

    return result
}
