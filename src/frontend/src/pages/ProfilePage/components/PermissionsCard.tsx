import React, { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Card } from '@shared/ui/primitives/Card'
import { EntityText } from '@shared/ui/primitives/Text'
import { PermissionEditor } from '@shared/ui/wizard-step/editor/permission-editor/PermissionEditor'
import { useAuth } from '@features/auth/useAuth'
import type { ComponentPermission } from '@entities/auth/model/types'

type PermissionsFormShape = {
    components: number[]
    mappedComponents: ComponentPermission[]
}

export function PermissionsCard({ style }: { style?: React.CSSProperties }) {
    const { user } = useAuth()

    const defaultValues = useMemo<PermissionsFormShape>(() => {
        const granted = user?.userGroup?.components ?? []
        return {
            components: granted.map((c) => c.componentId),
            mappedComponents: granted,
        }
    }, [user])

    const form = useForm<PermissionsFormShape>({ defaultValues })

    if (!user) return null

    return (
        <Card style={style} title={<EntityText i18nKey="profile.sections.permissions" typoProps={{ isBold: true }} />}>
            <FormProvider {...form}>
                <PermissionEditor name="mappedComponents" mode="view" />
            </FormProvider>
        </Card>
    )
}
