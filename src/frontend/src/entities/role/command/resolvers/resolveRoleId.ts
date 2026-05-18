import {store} from "@app/store/store.ts";
import {roleApi} from "@entities/role/api/roleApi.ts";
import {debouncePromise} from "@shared/utils/debouncePromise.ts";


export async function _resolveRoleIds(
    input: string
): Promise<string[]> {

    const result = await store.dispatch(
        roleApi.endpoints.getRoles.initiate(
            { page: 1, limit: 2, search: input },
            { subscribe: false, forceRefetch: true }
        )
    );

    if ('data' in result && result.data) {
        return result.data.map(u => u.groupId);
    }

    return [];
}

export const resolveRoleIds =
    debouncePromise(_resolveRoleIds, 300);
