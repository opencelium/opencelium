import { BaseQueryFn, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { normalizeError } from '@shared/errors/api/normalizeError.ts'
import { errorBus } from '@shared/errors/api/errorBus.ts'
import { selectAccessToken } from '@entities/auth/model/authSelectors'
import type { RootState } from '@app/store/types'
import { runtimeConfig } from '@shared/config/runtimeConfig'
import { findRequestOverride } from '@shared/api/requestOverrides'

// No `baseUrl` here — it's resolved per-request below via runtimeConfig.apiUrl, since
// that value isn't known yet at module-eval time (it's fetched async in main.tsx,
// which runs after this module's top-level code has already executed).
const rawBaseQuery = fetchBaseQuery({
    credentials: 'include',
    prepareHeaders: (headers, { getState, extra, arg }) => {
        const isMultipart =
            typeof arg === 'object' &&
            arg !== null &&
            'body' in arg &&
            typeof FormData !== 'undefined' &&
            (arg as { body?: unknown }).body instanceof FormData

        if (!headers.has('content-type') && !isMultipart) {
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

        if (isMultipart) {
            headers.delete('content-type')
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

const resolveAbsoluteUrl = (url: string): string =>
    /^https?:\/\//i.test(url) ? url : `${runtimeConfig.apiUrl}${url.startsWith('/') ? url : `/${url}`}`

const withAbsoluteUrl = (args: string | CustomFetchArgs): string | CustomFetchArgs =>
    typeof args === 'string' ? resolveAbsoluteUrl(args) : { ...args, url: resolveAbsoluteUrl(args.url) }

export const baseQuery: BaseQueryFn<
    string | CustomFetchArgs,
    unknown,
    FetchBaseQueryError,
    ExtraOptions
> = async (args, api, extraOptions) => {
    // Canned responses first (see requestOverrides): the workflow tutorial answers a
    // few GETs with invented data, and this is the only layer a refetch cannot undo.
    const requestUrl = typeof args === 'string' ? args : args.url
    const requestMethod = typeof args === 'string' ? 'GET' : args.method
    const override = findRequestOverride(requestUrl, requestMethod)
    if (override !== undefined) return { data: override }

    const result = await rawBaseQuery(
        withAbsoluteUrl(args),
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
        const appError = normalizeError(result.error, typeof args === 'string'
            ? { url: args }
            : { url: args.url, method: args.method })
        errorBus.emit(appError)
    }

    return result
}
