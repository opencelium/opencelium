import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from './login.schema'
import { getStringConstraints } from '@shared/form/zodConstraints.ts'

export function useLoginForm() {
    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    })

    const constraints = {
        email: getStringConstraints(loginSchema, 'email'),
        password: getStringConstraints(loginSchema, 'password'),
    }

    return { form, constraints }
}
