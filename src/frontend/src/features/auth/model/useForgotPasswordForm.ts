import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema } from './forgotPassword.schema'
import { getStringConstraints } from '@shared/form/zodConstraints.ts'

export function useForgotPasswordForm() {
    const form = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    })

    const constraints = {
        email: getStringConstraints(forgotPasswordSchema, 'email'),
    }

    return { form, constraints }
}
