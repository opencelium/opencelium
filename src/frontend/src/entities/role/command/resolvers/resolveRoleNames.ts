import {debouncePromise} from "@shared/utils/debouncePromise.ts";
import {ensureRoleMetaLoaded} from "@entities/role/command/roleCache.ts";

const SUGGESTION_LIMIT = 20;

export async function _resolveRoleNames(
    input: string
): Promise<string[]> {
    const list = await ensureRoleMetaLoaded();
    const needle = (input ?? '').toLowerCase();
    const matches = needle
        ? list.filter((r) => r.name.toLowerCase().includes(needle))
        : list;
    return matches.slice(0, SUGGESTION_LIMIT).map(r => r.name);
}

export const resolveRoleNames =
    debouncePromise(_resolveRoleNames, 300);
