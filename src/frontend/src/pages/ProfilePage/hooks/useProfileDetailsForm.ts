import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import type { FormConstraints, StringConstraints } from '@shared/form/types'
import { buildStringConstraints } from '@shared/form/zodConstraints'
import {
    profileDetailsSchema,
    type ProfileDetailsValues,
} from '@pages/ProfilePage/schemas/profileDetails.schema'

const REQUIRED_FIELDS: Array<keyof ProfileDetailsValues> = ['name', 'surname', 'phoneNumber', 'email']

export function useProfileDetailsForm(initialValues: ProfileDetailsValues) {
    const form = useForm<ProfileDetailsValues>({
        resolver: zodResolver(profileDetailsSchema),
        defaultValues: initialValues,
    })

    useEffect(() => {
        form.reset(initialValues)
    }, [initialValues, form])

    const constraints: FormConstraints = Object.fromEntries(
        (
            [
                'name',
                'surname',
                'department',
                'organization',
                'phoneNumber',
                'email',
            ] as const
        ).map((path) => {
            const c: StringConstraints = buildStringConstraints(profileDetailsSchema, path)
            if (REQUIRED_FIELDS.includes(path)) c.required = true
            return [path, c]
        }),
    )

    return { form, constraints }
}
