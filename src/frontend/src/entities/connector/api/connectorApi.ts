import { baseApi } from '@/shared/api/baseApi'
import type { Connector, ConnectorMetaDTO } from '../model/types';
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
                { type: 'Entity' as any, id: '/connector/all' },
                { type: CONNECTOR_TAG, id: 'LIST' },
                ...result.map((u) => ({ type: CONNECTOR_TAG, id: u.connectorId })),
              ]
              : [
                { type: 'Entity' as any, id: '/connector/all' },
                { type: CONNECTOR_TAG, id: 'LIST' },
              ],
    }),
    // Lightweight status-display snapshot (no credential decryption server-side) —
    // prefer this over getConnectors wherever the full Connector (requestData,
    // description, invoker.operations, ...) isn't needed.
    getConnectorsMeta: b.query<ConnectorMetaDTO[], void>({
      query: () => '/connector/meta/all',
      providesTags: (result) =>
          result
              ? [
                { type: 'Entity' as any, id: '/connector/meta/all' },
                { type: CONNECTOR_TAG, id: 'LIST' },
                ...result.map((c) => ({ type: CONNECTOR_TAG, id: c.connectorId })),
              ]
              : [
                { type: 'Entity' as any, id: '/connector/meta/all' },
                { type: CONNECTOR_TAG, id: 'LIST' },
              ],
    }),
    getConnector: b.mutation<
      Connector,
      { id: string, masterPassword: string }
    >({
      query: ({ masterPassword, id }) => ({
          url: `/connector/${id}`,
          method: 'GET',
          ...(masterPassword ? { headers: { 'x-master-password': masterPassword } } : {}),
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
          ...(masterPassword ? { headers: { 'x-master-password': masterPassword } } : {}),
      }),
    }),
  }),
})

export const {
    useGetConnectorsQuery,
    useGetConnectorsMetaQuery,
    useGetConnectorMutation,
    useSaveRequestDataMutation,
} = connectorApi
