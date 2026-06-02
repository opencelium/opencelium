import { baseApi } from '@/shared/api/baseApi'
import type { Schedule } from '../model/types';
import type { MaskingRule } from '../model/supportLogs';
import {SCHEDULE_TAG} from "@entities/schedule/api/schedule.tags.ts";

const SUPPORT_FILE_LIST_URL = '/connection/support-file/list';

export const scheduleApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getSchedules: b.query<
        Schedule[],
        { page: number; limit: number; search?: string }
    >({
      query: () =>
          `/scheduler/all`,
      providesTags: (result) =>
          result
              ? [
                { type: SCHEDULE_TAG, id: 'LIST' },
                ...result.map((u) => ({ type: SCHEDULE_TAG, id: u.schedulerId })),
              ]
              : [{ type: SCHEDULE_TAG, id: 'LIST' }],
    }),
    // Fetch a subset of schedules by id. Deliberately tag-free: the finished-run
    // refresh patches the '/scheduler/all' cache in place via updateQueryData,
    // so invalidating any tag here would trigger a redundant full refetch that
    // re-adds newly-created and drops deleted rows. No invalidatesTags keeps the
    // refresh an update-only merge.
    getSchedulesByIds: b.mutation<Schedule[], number[]>({
      query: (identifiers) => ({
        url: '/scheduler/list/get',
        method: 'POST',
        body: { identifiers },
      }),
    }),
    // Generate a masked support-logs file for a connection. Invalidates ONLY the
    // support-file list — not the global 'Entity' tag — so triggering it from the
    // schedules page doesn't force a redundant refetch of '/scheduler/all' (and
    // every other entity list). Routing through apiExecutor/generalRequest would
    // invalidate 'Entity' for any non-GET request, which is what we're avoiding.
    createSupportFile: b.mutation<
        { valid: boolean },
        { connectionId: number; rules: MaskingRule[] }
    >({
      query: ({ connectionId, rules }) => ({
        url: `/connection/execute/${connectionId}/support-file`,
        method: 'POST',
        body: rules,
      }),
      invalidatesTags: [{ type: 'Entity', id: SUPPORT_FILE_LIST_URL }],
    }),
  }),
})

export const {
    useGetSchedulesQuery,
    useGetSchedulesByIdsMutation,
    useCreateSupportFileMutation,
} = scheduleApi
