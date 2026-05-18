import { baseApi } from '@/shared/api/baseApi'
import type { Connector } from '../model/types';
import {CONNECTOR_TAG} from "@entities/connector/api/connector.tags.ts";

export const connectorApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getConnectors: b.query<
        Connector[],
        { page: number; limit: number; search?: string }
    >({
      query: ({ page, limit, search }) =>
          //`/connectors?page=${page}&limit=${limit}&search=${search ?? ''}`,
          `/connector/all`,
      providesTags: (result) =>
          result
              ? [
                { type: CONNECTOR_TAG, id: 'LIST' },
                ...result.map((u) => ({ type: CONNECTOR_TAG, id: u.connectorId })),
              ]
              : [{ type: CONNECTOR_TAG, id: 'LIST' }],
    }),
    getConnector: b.mutation<
      any,
      { id: string, masterPassword: string }
    >({
      query: ({ masterPassword, id }) => ({
          url: `/connector/${id}`,
          method: 'GET',
          headers: {
              'x-master-password': masterPassword,
          },
      }),
    }),
    saveRequestData: b.mutation<
      any,
      { id: string, masterPassword: string, requestData: Record<string, string> }
    >({
      query: ({ masterPassword, id, requestData }) => ({
          url: `/connector/${id}/required-data`,
          method: 'PUT',
          body: requestData,
          headers: {
              'x-master-password': masterPassword,
          },
      }),
    }),
  }),
})

export const {
    useGetConnectorsQuery,
    useGetConnectorMutation,
    useSaveRequestDataMutation,
} = connectorApi
