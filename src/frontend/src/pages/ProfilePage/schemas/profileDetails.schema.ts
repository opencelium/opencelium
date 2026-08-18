import { z } from 'zod'

export const profileDetailsSchema = z.object({
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
    email: z.string().trim().min(1, 'profile.validation.required').max(100),
})

export type ProfileDetailsValues = z.infer<typeof profileDetailsSchema>
