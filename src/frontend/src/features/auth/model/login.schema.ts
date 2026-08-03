import { z } from 'zod'

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'fields.email.required')
        .email('fields.email.invalid'),
    password: z.string().min(1, 'fields.password.required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
