import { z } from 'zod'

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'fields.email.required')
        .email('fields.email.invalid'),
    password: z.string().min(1, 'fields.password.required'),
    rememberMe: z.boolean().default(false),
})

export type LoginFormValues = z.infer<typeof loginSchema>
