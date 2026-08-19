import { z } from 'zod'

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'fields.emailOrUsername.required'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
