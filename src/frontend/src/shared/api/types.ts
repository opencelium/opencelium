/**
 * Generic type for the request body (Entity Data)
 */
export type EntityData = Record<string, unknown>;

/**
 * Arguments for fetching a list or a single entity
 */
export interface FetchEntitiesArgs {
    url: string;
    params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Arguments for mutations (Create/Update)
 */
export interface EntityMutationArgs<T = EntityData> {
    url: string;
    body: T;
}

/**
 * Arguments for deletion
 */
export interface EntityDeleteArgs {
    url: string; // Usually /api/resource/id
}
