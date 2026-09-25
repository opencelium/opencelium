import { z } from 'zod'

export const forgotPasswordSchema = z.object({
    // Refined rather than z.email() so the field stays a ZodString: the shared
    // constraint reader (max length, counter) only understands plain strings.
    email: z
        .string()
        .trim()
        .min(1, 'fields.email.required')
        .max(255)
        .refine((value) => value === '' || z.email().safeParse(value).success, {
            message: 'fields.email.invalid',
        }),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
