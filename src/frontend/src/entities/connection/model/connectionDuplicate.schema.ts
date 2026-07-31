import { z } from 'zod'

// Error message is an `entities`-namespace i18n key — FormControl renders it via
// EntityText, so it must resolve against that bundle.
export const connectionDuplicateSchema = z.object({
    title: z.string().trim().min(1, 'connection.list.duplicate.titleRequired'),
    description: z.string(),
})

export type ConnectionDuplicateValues = z.infer<typeof connectionDuplicateSchema>
