import type { EntityDefinition } from '@/engine/entity/EntityDefinition';
import { getValueByPath } from '@shared/utils/getValueByPath';

/** Resolve the row value used by an action — falls back to the pre-computed rowId. */
export function resolveActionValue(
    row: unknown,
    field: string | undefined,
    rowId: string,
): string {
    if (!field) return rowId;
    const raw = getValueByPath(row as Record<string, unknown>, field);
    return raw === undefined || raw === null ? rowId : String(raw);
}

/** Decide between single-segment and field-prefixed URL forms (matches command-palette). */
function isCustomPath(field: string | undefined, customPath: boolean | undefined): boolean {
    if (typeof customPath === 'boolean') return customPath;
    return !field;
}

export function buildNavigationUrl(
    entity: EntityDefinition,
    verb: 'view' | 'update',
    field: string | undefined,
    customPath: boolean | undefined,
    value: string,
): string {
    const encoded = encodeURIComponent(value);
    return isCustomPath(field, customPath)
        ? `/${entity.name}/${verb}/${encoded}`
        : `/${entity.name}/${verb}/${field}/${encoded}`;
}

export function buildDeleteUrl(
    entity: EntityDefinition,
    field: string | undefined,
    customPath: boolean | undefined,
    value: string,
): string {
    const baseUrl = entity.api?.baseUrl ?? `/${entity.name}`;
    const encoded = encodeURIComponent(value);
    return isCustomPath(field, customPath)
        ? `${baseUrl}/${encoded}`
        : `${baseUrl}/${field}/${encoded}`;
}
