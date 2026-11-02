import { z } from 'zod'

export const transformationRequestSchema = z.object({
    /** The user's request, with the wake word already stripped. */
    prompt: z.string().trim().min(1).max(1000),
    /** The fields of the request body or headers open in the editor, as paths (`ConfigItem.CIXMLData.Vendor`). */
    fields: z.array(z.string().trim().min(1).max(500)).min(1).max(300),
})

export type TransformationRequest = z.infer<typeof transformationRequestSchema>
