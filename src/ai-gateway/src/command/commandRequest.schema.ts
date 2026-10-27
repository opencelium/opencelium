import { z } from 'zod'

/** One command of the palette, as the frontend sends it: only the commands this user may run. */
export const catalogCommandSchema = z.object({
    id: z.string().min(1).max(300),
    /** The words the user would type, with `<name>` where a value goes, e.g. `delete schedule by id <identifier>`. */
    phrase: z.string().min(1).max(300),
    description: z.string().max(500).default(''),
})

export type CatalogCommand = z.infer<typeof catalogCommandSchema>

const commandsSchema = z.array(catalogCommandSchema).min(1).max(1000)

export const searchCommandsRequestSchema = z.object({
    query: z.string().trim().min(1).max(500),
    commands: commandsSchema,
    limit: z.number().int().min(1).max(20).default(5),
})

export const routeCommandRequestSchema = z.object({
    prompt: z.string().trim().min(1).max(1000),
    commands: commandsSchema,
    /** Where the user is, e.g. `/schedule`: "delete this one" or "show its logs" depend on it. */
    page: z.string().max(300).default(''),
    /** The UI language, for the reply: the descriptions mix English and German, so the request's own language misleads. */
    language: z.enum(['en', 'de']).default('en'),
})

export type RouteCommandRequest = z.infer<typeof routeCommandRequestSchema>
