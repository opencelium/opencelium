import React, { useState } from 'react'
import { message } from 'antd'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shared/ui/primitives/Button'
import { FormInput } from '@shared/ui/form/FormInput'
import { FormTextarea } from '@shared/ui/form/FormTextarea'
import { FormConstraintsProvider } from '@shared/form/FormConstraintsContext'
import { getStringConstraints } from '@shared/form/zodConstraints'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { apiExecutor } from '@shared/api/apiExecutor'
import { cleanConnectionForDuplicate } from '@entities/connection/model/cleanConnectionForDuplicate'
import {
    connectionDuplicateSchema,
    type ConnectionDuplicateValues,
} from '@entities/connection/model/connectionDuplicate.schema'
import type { Connection } from '@entities/connection/model/types'

type Props = {
    row: Connection
    onClose: () => void
}

const constraints = {
    title: { ...getStringConstraints(connectionDuplicateSchema, 'title'), required: true },
    description: getStringConstraints(connectionDuplicateSchema, 'description'),
}

export const DuplicateConnectionForm: React.FC<Props> = ({ row, onClose }) => {
    const { t: tEntities } = useI18n('entities')
    const form = useForm<ConnectionDuplicateValues>({
        resolver: zodResolver(connectionDuplicateSchema),
        defaultValues: {
            title: tEntities('connection.list.duplicate.defaultTitle', { title: row.title }),
            description: row.description ?? '',
        },
    })

    const [isLoading, setIsLoading] = useState(false)

    const onSubmit = async (data: ConnectionDuplicateValues) => {
        const {title, description} = data;
        if (row.id == null) return
        setIsLoading(true)
        try {
            // Reject a duplicate title up front and surface it on the field itself.
            const check = await apiExecutor({
                url: `/connection/check/${encodeURIComponent(title)}`,
                method: 'GET',
            })
            if (!check || typeof check !== 'object' || !('message' in check)) return
            if ((check as { message?: string }).message === 'EXISTS') {
                form.setError('title', { message: 'connection.list.duplicate.titleExists' })
                return
            }

            // apiExecutor returns the RTK Query error object (already surfaced via
            // errorBus) instead of throwing, so reject anything missing the
            // connection shape before we clean and re-post it.
            const source = await apiExecutor({ url: `/connection/${row.id}`, method: 'GET' })
            if (!source || typeof source !== 'object' || !('fromConnector' in source)) return

            const body = cleanConnectionForDuplicate(source, { title, description })

            const created = await apiExecutor({ url: '/connection', method: 'POST', body })
            if (created && typeof created === 'object' && 'status' in created) return

            message.success(tEntities('connection.list.duplicate.success', { name: title }))
            onClose()
        } catch (err) {
            console.error(err)
            message.error(tEntities('connection.list.duplicate.error'))
        } finally {
            setIsLoading(false)
        }
    }

    const isSubmitting = isLoading || form.formState.isSubmitting

    return (
        <FormProvider {...form}>
            <FormConstraintsProvider constraints={constraints}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                    <FormInput
                        name="title"
                        labelKey="connection.list.duplicate.titleLabel"
                        readOnly={isSubmitting}
                        autoFocus
                        testId="connection-duplicate-title"
                    />
                    <FormTextarea
                        name="description"
                        labelKey="connection.list.duplicate.descriptionLabel"
                        readOnly={isSubmitting}
                        testId="connection-duplicate-description"
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button type="default" onClick={onClose} disabled={isSubmitting} testId="connection-duplicate-cancel">
                            {tEntities('connection.list.duplicate.cancel')}
                        </Button>
                        <Button
                            htmlType="submit"
                            type="primary"
                            iconLeft="content-copy"
                            loading={isSubmitting}
                            testId="connection-duplicate-submit"
                        >
                            {tEntities('connection.list.duplicate.submit')}
                        </Button>
                    </div>
                </form>
            </FormConstraintsProvider>
        </FormProvider>
    )
}
