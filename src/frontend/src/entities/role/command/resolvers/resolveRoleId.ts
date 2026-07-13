import {debouncePromise} from "@shared/utils/debouncePromise.ts";
import {ensureRoleMetaLoaded} from "@entities/role/command/roleCache.ts";

const SUGGESTION_LIMIT = 20;

export async function _resolveRoleIds(
    input: string
): Promise<string[]> {
    const list = await ensureRoleMetaLoaded();
    const needle = (input ?? '').trim();
    const matches = needle
        ? list.filter((r) => String(r.groupId).includes(needle))
        : list;
    return matches.slice(0, SUGGESTION_LIMIT).map(r => String(r.groupId));
}

export const resolveRoleIds =
    debouncePromise(_resolveRoleIds, 300);
