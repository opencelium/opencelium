import {store} from "@app/store/store.ts";
import {debouncePromise} from "@shared/utils/debouncePromise.ts";
import {connectorApi} from "@entities/connector/api/connectorApi.ts";


export async function _resolveConnectorIds(
    input: string
): Promise<string[]> {

    const result = await store.dispatch(
        connectorApi.endpoints.getConnectors.initiate(
            { page: 1, limit: 2, search: input },
            { subscribe: false, forceRefetch: true }
        )
    );

    if ('data' in result && result.data) {
        return result.data.map(u => u.connectorId);
    }

    return [];
}

export const resolveConnectorIds =
    debouncePromise(_resolveConnectorIds, 300);
