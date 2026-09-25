import {z} from "zod";

const passwordRules = {
    upper: /[A-Z]/,
    lower: /[a-z]/,
    number: /\d/,
    special: /[^A-Za-z0-9]/,
};
const passwordSchema = z
    .string('Password is a required field')
    .min(8, 'Minimum 8 characters')
    .max(16, 'Maximum 16 characters')
    .regex(passwordRules.upper, 'Must contain uppercase letter')
    .regex(passwordRules.lower, 'Must contain lowercase letter')
    .regex(passwordRules.number, 'Must contain a number')
    .regex(passwordRules.special, 'Must contain special character');
export const userCredentialsSchema = z
    .object({
        email: z.email('Invalid email'),
        username: z.string().max(255, 'Maximum 255 characters'),
        password: passwordSchema,
        repeatPassword: z.string('Repeat password is a required field'),
    })
    .refine((data) => data.password === data.repeatPassword, {
        message: 'Passwords do not match',
        path: ['repeatPassword'],
    });
