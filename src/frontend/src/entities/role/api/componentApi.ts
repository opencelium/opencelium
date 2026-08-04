import { baseApi } from '@/shared/api/baseApi'
import {COMPONENT_TAG} from "@entities/role/api/component.tags.ts";
import type {Component} from "@entities/role/model/types.ts";

export const componentApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getComponents: b.query<
        Component[],
        { page: number; limit: number; search?: string }
    >({
      query: () =>
          `/component/all`,
      providesTags: (result) =>
          result
              ? [
                { type: COMPONENT_TAG, id: 'LIST' },
                ...result.map((u) => ({ type: COMPONENT_TAG, id: u.userId })),
              ]
              : [{ type: COMPONENT_TAG, id: 'LIST' }],
    }),
  }),
})

export const {
  useGetComponentsQuery,
} = componentApi
