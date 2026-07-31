import {createApi} from "@reduxjs/toolkit/query/react";
import {baseQuery} from "@shared/api/baseQuery.ts";

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery,
    // Refetch on every mount/arg change so navigating back to a page always
    // revalidates against the server. The cached data still renders instantly
    // while the refetch runs in the background.
    refetchOnMountOrArgChange: true,
    endpoints: () => ({}),
})
