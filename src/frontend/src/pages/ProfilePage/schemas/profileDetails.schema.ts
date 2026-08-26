import { z } from 'zod'

const hasCredential = (data: { email: string; username: string }): boolean =>
    Boolean(data.email.trim() || data.username.trim())

export const profileDetailsSchema = z
    .object({
        userTitle: z.enum(['mr', 'mrs']).nullable(),
        name: z.string().trim().min(1, 'profile.validation.required').max(50),
        surname: z.string().trim().min(1, 'profile.validation.required').max(50),
        department: z.string().trim().max(100).optional().or(z.literal('')),
        organization: z.string().trim().max(100).optional().or(z.literal('')),
        phoneNumber: z
            .string()
            .regex(/^[+]?[\d\s\-()]{6,20}$/, 'profile.fields.phoneNumber.validation1')
            .or(z.literal(''))
            .optional(),
        // Refined rather than z.email() so the field stays a ZodString: the shared
        // constraint reader (max length, counter) only understands plain strings, and
        // an empty value is legal as long as the username carries the login.
        email: z
            .string()
            .trim()
            .max(255)
            .refine((value) => value === '' || z.email().safeParse(value).success, {
                message: 'profile.fields.email.invalid',
            }),
        username: z.string().trim().max(255),
    })
    // Either credential signs the user in, so neither is required on its own — but
    // clearing both would leave the account with no way to log in. Reported on both
    // fields so the message shows wherever the user is looking.
    .refine(hasCredential, { message: 'profile.validation.emailOrUsername', path: ['email'] })
    .refine(hasCredential, { message: 'profile.validation.emailOrUsername', path: ['username'] })

export type ProfileDetailsValues = z.infer<typeof profileDetailsSchema>
