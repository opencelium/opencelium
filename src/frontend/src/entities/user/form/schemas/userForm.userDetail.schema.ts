import {z} from "zod";

export const userDetailSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(50, 'Name is too long'),

    surname: z
        .string()
        .min(1, 'Surname is required')
        .max(50, 'Surname is too long'),

    department: z
        .string()
        .max(100, 'Department is too long')
        .optional(),

    organization: z
        .string()
        .max(100, 'Organization is too long')
        .optional(),

    phoneNumber: z
        .string()
        .regex(/^[+]?[\d\s\-()]{6,20}$/, 'Invalid phone number format')
        .or(z.literal(''))
        .optional(),
});
