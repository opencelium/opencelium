import { z } from 'zod'

/** One "show me where" guide the frontend can run; the frontend owns the list, so a new guide needs no gateway change. */
export const guideOptionSchema = z.object({
    id: z.string().trim().min(1).max(100),
    /** What the guide shows, in English and German, for the model to match the request against. */
    description: z.string().max(500),
    /** Changes the workflow rather than showing something: never chosen for a question about how to do it. */
    isAction: z.boolean().default(false),
    /** The action this guide shows how to do: a how-question read as that action is this guide instead. */
    teaches: z.string().trim().max(50).optional(),
    /** The option to use instead when the request names a method: "test the workflow" vs. "test getCustomers". */
    withMethod: z.string().trim().max(50).optional(),
})

export const routeGuideRequestSchema = z.object({
    /** The user's request, with the wake word already stripped. */
    prompt: z.string().trim().min(1).max(1000),
    guides: z.array(guideOptionSchema).min(1).max(50),
    /** The method names in the open workflow: the answer can only name one of these. */
    methods: z.array(z.string().trim().min(1).max(200)).max(500).default([]),
})

export type GuideOption = z.infer<typeof guideOptionSchema>
export type RouteGuideRequest = z.infer<typeof routeGuideRequestSchema>
