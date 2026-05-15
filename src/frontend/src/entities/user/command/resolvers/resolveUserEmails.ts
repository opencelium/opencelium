import {store} from "@app/store/store.ts";
import {userApi} from "@entities/user/api/userApi.ts";
import {debouncePromise} from "@shared/utils/debouncePromise.ts";


export async function _resolveUserEmails(
    input: string
): Promise<string[]> {

    const result = await store.dispatch(
        userApi.endpoints.getUsers.initiate(
            { page: 1, limit: 2, search: input },
            { subscribe: false }
        )
    );

    if ('data' in result && result.data) {
        return result.data.map(u => u.email);
    }

    return [];
}

export const resolveUserEmails =
    debouncePromise(_resolveUserEmails, 300);
