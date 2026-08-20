import {store} from "@app/store/store.ts";
import {debouncePromise} from "@shared/utils/debouncePromise.ts";
import {scheduleApi} from "@entities/schedule/api/scheduleApi.ts";


export async function _resolveScheduleIds(
    input: string
): Promise<string[]> {

    const result = await store.dispatch(
        scheduleApi.endpoints.getSchedules.initiate(
            { page: 1, limit: 2, search: input },
            { subscribe: false, forceRefetch: true }
        )
    );

    if ('data' in result && result.data) {
        return result.data.map(u => String(u.schedulerId));
    }

    return [];
}

export const resolveScheduleIds =
    debouncePromise(_resolveScheduleIds, 300);
