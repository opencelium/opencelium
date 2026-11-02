import { z } from 'zod'

export const mappingRequestSchema = z.object({
    /** The user's request, with the wake word already stripped. */
    prompt: z.string().trim().min(1).max(1000),
    /** The open workflow's method names, in workflow order: what the request can name as target and source. */
    methods: z.array(z.string().trim().min(1).max(200)).min(1).max(500),
})

export type MappingRequest = z.infer<typeof mappingRequestSchema>
