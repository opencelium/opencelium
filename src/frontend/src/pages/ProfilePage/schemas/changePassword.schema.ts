import { z } from 'zod'

export const changePasswordBaseSchema = z.object({
    currentPassword: z.string().min(1, 'profile.validation.required'),
    newPassword: z
        .string()
        .min(8)
        .max(16)
        .regex(/[A-Z]/, 'profile.fields.newPassword.validation1')
        .regex(/[a-z]/, 'profile.fields.newPassword.validation2')
        .regex(/\d/, 'profile.fields.newPassword.validation3')
        .regex(/[^A-Za-z0-9]/, 'profile.fields.newPassword.validation4'),
    repeatNewPassword: z.string().min(1, 'profile.validation.required'),
})

export const changePasswordSchema = changePasswordBaseSchema.refine(
    (data) => data.newPassword === data.repeatNewPassword,
    {
        path: ['repeatNewPassword'],
        message: 'profile.fields.repeatNewPassword.mismatch',
    },
)

export type ChangePasswordValues = z.infer<typeof changePasswordBaseSchema>
