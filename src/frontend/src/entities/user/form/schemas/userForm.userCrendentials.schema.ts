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
    .regex(passwordRules.upper, 'Must contain uppercase letter')
    .regex(passwordRules.lower, 'Must contain lowercase letter')
    .regex(passwordRules.number, 'Must contain a number')
    .regex(passwordRules.special, 'Must contain special character');
const hasEmailOrUsername = (data: { email: string; username: string }): boolean =>
    Boolean(data.email.trim() || data.username.trim());

export const userCredentialsSchema = z
    .object({
        // Refined rather than z.email() so an empty value stays legal when the username
        // carries the login, and the field stays a ZodString for buildStringConstraints.
        email: z
            .string()
            .trim()
            .max(255, 'Maximum 255 characters')
            .refine((value) => value === '' || z.email().safeParse(value).success, 'Invalid email'),
        username: z.string().trim().max(255, 'Maximum 255 characters'),
        password: passwordSchema,
        repeatPassword: z.string('Repeat password is a required field'),
    })
    .refine((data) => data.password === data.repeatPassword, {
        message: 'Passwords do not match',
        path: ['repeatPassword'],
    })
    .refine(hasEmailOrUsername, { message: 'Provide either an email or a username', path: ['email'] })
    .refine(hasEmailOrUsername, { message: 'Provide either an email or a username', path: ['username'] });
