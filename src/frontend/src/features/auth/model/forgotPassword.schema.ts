import { z } from 'zod'

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'fields.email.required')
        .email('fields.email.invalid'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
