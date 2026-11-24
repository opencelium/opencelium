import { z } from 'zod'

export const forgotPasswordSchema = z.object({
    // Refined rather than z.email() so the field stays a ZodString: the shared
    // constraint reader (max length, counter) only understands plain strings.
    email: z
        .string()
        .trim()
        .min(1, 'fields.email.required')
        .max(255)
        // Accounts without an email (typically LDAP users) tend to type their
        // username here; reset is email-only, so explain why and where to go.
        .refine((value) => value === '' || z.email().safeParse(value).success, {
            message: 'forgotPassword.emailRequiredForReset',
        }),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
