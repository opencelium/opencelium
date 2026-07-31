import { baseApi } from "@/shared/api/baseApi";
import type {
  DetailedMethodLog,
  FlowchartChildLog,
  FlowchartLog,
  LogFileStatus,
} from "../model/types";

export const logsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // List the stored log files for a connection/schedule, filtered by run status.
    getLogFiles: b.query<
      string[],
      { connectionId: number; schedulerId: number; status: LogFileStatus }
    >({
      query: ({ connectionId, schedulerId, status }) =>
        `/execution/log-files?connectionId=${connectionId}&schedulerId=${schedulerId}&status=${status}`,
      transformResponse: (response: { result: string[] }) =>
        response.result ?? [],
    }),
    // Top-level connectors for an execution.
    getExecutionConnectors: b.query<FlowchartLog[], string>({
      query: (executionId) => `/execution/log/element/${executionId}/children`,
    }),
    // Children of a connector or operator element. `loopIndex` selects the
    // iteration to load for loop operators (defaults to 0 on the backend).
    getElementChildren: b.query<
      FlowchartChildLog[],
      { id: string; loopIndex?: number }
    >({
      query: ({ id, loopIndex }) =>
        loopIndex === undefined
          ? `/execution/log/element/${id}/children`
          : `/execution/log/element/${id}/children?loopIndex=${loopIndex}`,
    }),
    // Full request/response detail for a single method element.
    getMethodDetails: b.query<DetailedMethodLog, string>({
      query: (id) => `/execution/log/element/${id}/details`,
    }),
  }),
});

export const {
  useGetLogFilesQuery,
  useGetExecutionConnectorsQuery,
  useGetElementChildrenQuery,
  useGetMethodDetailsQuery,
} = logsApi;
