import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FormConstraints } from '@shared/form/types'
import { buildStringConstraints } from '@shared/form/zodConstraints'
import {
    changePasswordBaseSchema,
    changePasswordSchema,
    type ChangePasswordValues,
} from '@pages/ProfilePage/schemas/changePassword.schema'

const EMPTY: ChangePasswordValues = {
    currentPassword: '',
    newPassword: '',
    repeatNewPassword: '',
}

export function useChangePasswordForm() {
    const form = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: EMPTY,
    })

    const constraints: FormConstraints = {
        currentPassword: { ...buildStringConstraints(changePasswordBaseSchema, 'currentPassword'), required: true },
        newPassword: { ...buildStringConstraints(changePasswordBaseSchema, 'newPassword'), required: true },
        repeatNewPassword: {
            ...buildStringConstraints(changePasswordBaseSchema, 'repeatNewPassword'),
            required: true,
        },
    }

    return { form, constraints }
}
