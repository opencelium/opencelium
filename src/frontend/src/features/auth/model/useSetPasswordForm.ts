import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { setPasswordSchema } from './setPassword.schema'

export function useSetPasswordForm() {
    return useForm({
        resolver: zodResolver(setPasswordSchema),
        defaultValues: { password: '', repeatPassword: '' },
    })
}
