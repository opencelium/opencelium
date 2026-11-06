import { z } from 'zod'

export const operatorRequestSchema = z.object({
    /** The user's request, with the wake word already stripped. */
    prompt: z.string().trim().min(1).max(1000),
    /** The open workflow's methods, in workflow order: what "after X" or "before X" can name. */
    steps: z.array(z.object({
        id: z.string().trim().min(1).max(100),
        label: z.string().trim().min(1).max(200),
    })).max(500).default([]),
})

export type OperatorRequest = z.infer<typeof operatorRequestSchema>
