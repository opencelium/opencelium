import { z } from 'zod'

const passwordRules = {
    upper: /[A-Z]/,
    lower: /[a-z]/,
    number: /\d/,
    special: /[^A-Za-z0-9]/,
}

export const setPasswordSchema = z
    .object({
        password: z
            .string()
            .min(1, 'setPassword.fields.password.required')
            .min(8, 'setPassword.fields.password.minLength')
            .max(16, 'setPassword.fields.password.maxLength')
            .regex(passwordRules.upper, 'setPassword.fields.password.upper')
            .regex(passwordRules.lower, 'setPassword.fields.password.lower')
            .regex(passwordRules.number, 'setPassword.fields.password.number')
            .regex(passwordRules.special, 'setPassword.fields.password.special'),
        repeatPassword: z.string().min(1, 'setPassword.fields.repeatPassword.required'),
    })
    .refine((data) => data.password === data.repeatPassword, {
        message: 'setPassword.fields.repeatPassword.mismatch',
        path: ['repeatPassword'],
    })

export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>
