import {store} from "@app/store/store.ts";
import {roleApi} from "@entities/role/api/roleApi.ts";
import {debouncePromise} from "@shared/utils/debouncePromise.ts";
import {_resolveUserEmails} from "@entities/user/command/resolvers/resolveUserEmails.ts";


export async function _resolveRoleNames(
    input: string
): Promise<string[]> {

    const result = await store.dispatch(
        roleApi.endpoints.getRoles.initiate(
            { page: 1, limit: 2, search: input },
            { subscribe: false }
        )
    );

    if ('data' in result && result.data) {
        return result.data.map(u => u.name);
    }

    return [];
}

export const resolveRoleNames =
    debouncePromise(_resolveRoleNames, 300);
