import {store} from "@app/store/store.ts";
import {connectorApi} from "@entities/connector/api/connectorApi.ts";
import {debouncePromise} from "@shared/utils/debouncePromise.ts";


export async function _resolveConnectorTitles(
    input: string
): Promise<string[]> {

    const result = await store.dispatch(
        connectorApi.endpoints.getConnectors.initiate(
            { page: 1, limit: 2, search: input },
            { subscribe: false }
        )
    );

    if ('data' in result && result.data) {
        return result.data.map(u => u.title);
    }

    return [];
}

export const resolveConnectorTitles =
    debouncePromise(_resolveConnectorTitles, 300);
