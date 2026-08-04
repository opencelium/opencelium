import {store} from "@app/store/store.ts";
import {debouncePromise} from "@shared/utils/debouncePromise.ts";
import {scheduleApi} from "@entities/schedule/api/scheduleApi.ts";


export async function _resolveScheduleConnectionTitles(
    input: string
): Promise<string[]> {

    const result = await store.dispatch(
        scheduleApi.endpoints.getSchedules.initiate(
            { page: 1, limit: 2, search: input },
            { subscribe: false }
        )
    );

    if ('data' in result && result.data) {
        return result.data.map(u => `${u.connection.title} [${u.schedulerId}]`);
    }

    return [];
}

export const resolveScheduleConnectionTitles =
    debouncePromise(_resolveScheduleConnectionTitles, 300);
