import { baseApi } from '@/shared/api/baseApi'
import type { Schedule } from '../model/types';
import {SCHEDULE_TAG} from "@entities/schedule/api/schedule.tags.ts";

export const scheduleApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getSchedules: b.query<
        Schedule[],
        { page: number; limit: number; search?: string }
    >({
      query: ({ page, limit, search }) =>
          `/scheduler/all`,
      providesTags: (result) =>
          result
              ? [
                { type: SCHEDULE_TAG, id: 'LIST' },
                ...result.map((u) => ({ type: SCHEDULE_TAG, id: u.schedulerId })),
              ]
              : [{ type: SCHEDULE_TAG, id: 'LIST' }],
    }),
  }),
})

export const {
    useGetSchedulesQuery,
} = scheduleApi
