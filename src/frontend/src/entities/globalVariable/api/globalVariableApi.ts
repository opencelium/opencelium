import type { FetchBaseQueryMeta } from '@reduxjs/toolkit/query'
import { baseApi } from '@shared/api/baseApi'
import type {
    GlobalVariable,
    GlobalVariableChange,
    GlobalVariableChangesQuery,
    GlobalVariableListItem,
    GlobalVariableListQuery,
    GlobalVariablePermissions,
    GlobalVariablePermissionsDto,
    GlobalVariableSaveDto,
    GlobalVariableUsage,
    GlobalVariableValue,
    ImpactRequest,
    ImpactResult,
    PagedResponse,
    ValidateScriptRequest,
    ValidateScriptResponse,
} from '../model/types'
import { GLOBAL_VARIABLE_TAG } from './globalVariable.tags'

const BASE = '/global-variable'
const ENTITY_TAG = 'Entity' as const

// Last ETag and body per id set, so a 304 can answer from what was already fetched.
const valuesCache = new Map<string, { etag: string; data: GlobalVariableValue[] }>()

const toQueryString = (params: Record<string, string | number | undefined>) =>
    new URLSearchParams(
        Object.entries(params).flatMap(([key, value]) => (value === undefined || value === '' ? [] : [[key, String(value)]])),
    ).toString()

export const globalVariableApi = baseApi
    .enhanceEndpoints({ addTagTypes: [GLOBAL_VARIABLE_TAG, ENTITY_TAG] })
    .injectEndpoints({
        endpoints: (b) => ({
            searchGlobalVariables: b.query<PagedResponse<GlobalVariableListItem>, GlobalVariableListQuery>({
                query: (params) => `${BASE}/all?${toQueryString(params)}`,
                providesTags: [ENTITY_TAG],
            }),

            getGlobalVariable: b.query<GlobalVariable, number>({
                query: (id) => ({ url: `${BASE}/${id}`, customOptions: { ignoreError: true } }),
                providesTags: (_result, _error, id) => [{ type: GLOBAL_VARIABLE_TAG, id }],
            }),

            getGlobalVariableValues: b.query<GlobalVariableValue[], number[]>({
                async queryFn(ids, _api, _extra, baseQuery) {
                    const key = ids.join(',')
                    const cached = valuesCache.get(key)
                    const result = await baseQuery({
                        url: `${BASE}/values?ids=${key}`,
                        method: 'GET',
                        validateStatus: (response) => response.ok || response.status === 304,
                        customOptions: {
                            ignoreError: true,
                            headers: cached ? { 'If-None-Match': cached.etag } : undefined,
                        },
                    })
                    if (result.error) return { error: result.error }
                    // baseQuery is fetchBaseQuery underneath, but its declared meta type is `{}`.
                    const response = (result.meta as FetchBaseQueryMeta | undefined)?.response
                    if (response?.status === 304 && cached) return { data: cached.data }
                    const data = result.data as GlobalVariableValue[]
                    const etag = response?.headers.get('ETag')
                    if (etag) valuesCache.set(key, { etag, data })
                    return { data }
                },
            }),

            getGlobalVariableUsage: b.query<GlobalVariableUsage[], number>({
                query: (id) => `${BASE}/${id}/usage`,
                providesTags: (_result, _error, id) => [{ type: GLOBAL_VARIABLE_TAG, id: `usage-${id}` }],
            }),

            getGlobalVariableChanges: b.query<PagedResponse<GlobalVariableChange>, { id: number } & GlobalVariableChangesQuery>({
                query: ({ id, ...params }) => `${BASE}/${id}/changes?${toQueryString(params)}`,
                providesTags: (_result, _error, { id }) => [{ type: GLOBAL_VARIABLE_TAG, id: `changes-${id}` }],
            }),

            createGlobalVariable: b.mutation<GlobalVariable, GlobalVariableSaveDto>({
                query: (body) => ({ url: BASE, method: 'POST', body, customOptions: { ignoreError: true } }),
                invalidatesTags: [ENTITY_TAG],
            }),

            updateGlobalVariable: b.mutation<GlobalVariable, { id: number; body: GlobalVariableSaveDto }>({
                query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PUT', body, customOptions: { ignoreError: true } }),
                invalidatesTags: (_result, _error, { id }) => [
                    ENTITY_TAG,
                    { type: GLOBAL_VARIABLE_TAG, id },
                    { type: GLOBAL_VARIABLE_TAG, id: `changes-${id}` },
                ],
            }),

            deleteGlobalVariable: b.mutation<void, number>({
                query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE', customOptions: { ignoreError: true } }),
                invalidatesTags: [ENTITY_TAG],
            }),

            previewGlobalVariableImpact: b.mutation<ImpactResult, { id: number; body: ImpactRequest }>({
                query: ({ id, body }) => ({ url: `${BASE}/${id}/impact`, method: 'POST', body }),
            }),

            restoreGlobalVariableChange: b.mutation<GlobalVariable, { id: number; changeId: number; version: number }>({
                query: ({ id, changeId, version }) => ({
                    url: `${BASE}/${id}/restore/${changeId}`,
                    method: 'POST',
                    body: { version },
                    customOptions: { ignoreError: true },
                }),
                invalidatesTags: (_result, _error, { id }) => [
                    ENTITY_TAG,
                    { type: GLOBAL_VARIABLE_TAG, id },
                    { type: GLOBAL_VARIABLE_TAG, id: `changes-${id}` },
                ],
            }),

            validateGlobalScript: b.mutation<ValidateScriptResponse, ValidateScriptRequest>({
                query: (body) => ({ url: `${BASE}/validate-script`, method: 'POST', body }),
            }),

            getGlobalVariablePermissions: b.query<GlobalVariablePermissions, number>({
                query: (id) => `${BASE}/${id}/permissions`,
                providesTags: (_result, _error, id) => [{ type: GLOBAL_VARIABLE_TAG, id: `permissions-${id}` }],
            }),

            updateGlobalVariablePermissions: b.mutation<GlobalVariablePermissions, { id: number; body: GlobalVariablePermissionsDto }>({
                query: ({ id, body }) => ({ url: `${BASE}/${id}/permissions`, method: 'PUT', body }),
                invalidatesTags: (_result, _error, { id }) => [
                    { type: GLOBAL_VARIABLE_TAG, id: `permissions-${id}` },
                    { type: GLOBAL_VARIABLE_TAG, id: `changes-${id}` },
                ],
            }),
        }),
    })

export const {
    useSearchGlobalVariablesQuery,
    useGetGlobalVariableQuery,
    useGetGlobalVariableValuesQuery,
    useGetGlobalVariableUsageQuery,
    useGetGlobalVariableChangesQuery,
    useCreateGlobalVariableMutation,
    useUpdateGlobalVariableMutation,
    useDeleteGlobalVariableMutation,
    usePreviewGlobalVariableImpactMutation,
    useRestoreGlobalVariableChangeMutation,
    useValidateGlobalScriptMutation,
    useGetGlobalVariablePermissionsQuery,
    useUpdateGlobalVariablePermissionsMutation,
} = globalVariableApi
