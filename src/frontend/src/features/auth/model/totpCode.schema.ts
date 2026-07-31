import { z } from 'zod'

export const totpCodeSchema = z.object({
    code: z.string().trim().min(1, 'totp.errors.required'),
})

export type TotpCodeValues = z.infer<typeof totpCodeSchema>
