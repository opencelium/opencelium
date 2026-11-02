import { z } from 'zod'

export const addMethodRequestSchema = z.object({
    /** The user's request, with the wake word already stripped. */
    prompt: z.string().trim().min(1).max(1000),
    /** The connectors the user can add from: their own name, and the invoker that defines their operations. */
    connectors: z.array(z.object({
        id: z.string().trim().min(1).max(50),
        title: z.string().trim().min(1).max(200),
        invoker: z.string().trim().min(1).max(200),
    })).min(1).max(200),
    /** The open workflow's methods, in workflow order: what "after X" or "before X" can name. */
    steps: z.array(z.object({
        id: z.string().trim().min(1).max(100),
        label: z.string().trim().min(1).max(200),
    })).max(500).default([]),
})

export type AddMethodRequest = z.infer<typeof addMethodRequestSchema>
