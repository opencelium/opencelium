import { z } from 'zod'

export const DRAFT_FIELD_TYPES = ['string', 'number', 'boolean', 'object', 'array'] as const
export const DRAFT_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
export const DRAFT_AUTH_KINDS = ['none', 'basic', 'bearer', 'apikeyHeader', 'apikeyQuery'] as const

export type DraftField = { name: string; type: (typeof DRAFT_FIELD_TYPES)[number]; children: DraftField[] }

// Recursive types are declared by hand: zod cannot infer a type that refers to itself.
export const draftFieldSchema: z.ZodType<DraftField> = z.lazy(() => z.object({
    name: z.string().min(1).max(200),
    type: z.enum(DRAFT_FIELD_TYPES),
    children: z.array(draftFieldSchema).max(200),
}))

const bodySchema = z.object({
    /** `array` when the body is a list of the fields (a JSON array of objects). */
    type: z.enum(['object', 'array']),
    fields: z.array(draftFieldSchema).max(200),
})

export const draftOperationSchema = z.object({
    /** Unique within the invoker; what workflows show and call. */
    name: z.string().min(1).max(120).regex(/^[\w.-]+$/),
    method: z.enum(DRAFT_METHODS),
    /** After the base URL, starting with "/"; placeholders such as {id} become workflow params. */
    path: z.string().min(1).max(1000),
    summary: z.string().max(500).default(''),
    /** The group the docs put it in (OpenAPI tag), for picking operations in the review. */
    group: z.string().max(120).default(''),
    request: bodySchema.nullable(),
    response: bodySchema.extend({ status: z.string().max(10).default('200') }),
})

export const invokerDraftSchema = z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2000).default(''),
    /** Where the docs live, shown to whoever sets up a connector. */
    hint: z.string().max(2000).default(''),
    /** e.g. Ticketsystem, Monitoring, CMDB, Inventory, Asset Management. */
    category: z.string().max(80).default(''),
    auth: z.object({
        kind: z.enum(DRAFT_AUTH_KINDS),
        /** The header or query parameter carrying the API key (apikeyHeader / apikeyQuery). */
        keyName: z.string().max(120).default(''),
    }),
    /** Example base URL, e.g. https://{instance}.example.com/api; becomes the connector's default url. */
    baseUrl: z.string().max(500).default(''),
    operations: z.array(draftOperationSchema).min(1).max(1000),
    /** The operation (a cheap GET) whose call checks a connector's settings. */
    testOperation: z.string().max(120).default(''),
})

export type InvokerDraft = z.infer<typeof invokerDraftSchema>
export type DraftOperation = z.infer<typeof draftOperationSchema>
export type DraftBody = z.infer<typeof bodySchema>
