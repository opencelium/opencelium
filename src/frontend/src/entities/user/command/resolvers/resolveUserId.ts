import {store} from "@app/store/store.ts";
import {userApi} from "@entities/user/api/userApi.ts";
import {debouncePromise} from "@shared/utils/debouncePromise.ts";


export async function _resolveUserIds(
    input: string
): Promise<string[]> {

    const result = await store.dispatch(
        userApi.endpoints.getUsers.initiate(
            { page: 1, limit: 2, search: input },
            { subscribe: false, forceRefetch: true }
        )
    );

    if ('data' in result && result.data) {
        return result.data.map(u => String(u.userId));
    }

    return [];
}

export const resolveUserIds =
    debouncePromise(_resolveUserIds, 300);
