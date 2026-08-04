import React, {useEffect} from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { buildDefaultValues } from '../builders/buildDefaultValues'
import { buildZodSchema } from '../builders/buildZodSchema'
import { overrideRegistry } from '../overrides/overrideRegistry'
import type { EntityDefinition, Mode } from '../EntityDefinition'

type Props = {
    entity: EntityDefinition
    mode: Mode
    onSubmit: (data: unknown) => void
}

export function EntityForm({ entity, mode, onSubmit }: Props) {
    const schema = React.useMemo(
        () => buildZodSchema(entity),
        [entity]
    )

    const defaultValues = React.useMemo(
        () => buildDefaultValues(entity),
        [entity]
    )

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues
    })
    const renderField = (field: unknown) => {
        const Override = overrideRegistry.getField(field.ui.overrideKey)

        const defaultRender = () => (
            <input
                {...form.register(field.name)}
                type={field.ui.component === 'password' ? 'password' : 'text'}
            />
        )

        if (Override) {
            return (
                <Override
                    field={field}
                    mode={mode}
                    defaultRender={defaultRender}
                />
            )
        }

        return defaultRender()
    }
    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                {entity.fields.map(field => (
                    <div key={field.name} style={{ marginBottom: 12 }}>
                        <label>{field.name}</label>
                        {renderField(field)}
                    </div>
                ))}
                <button type="submit">Submit</button>
            </form>
        </FormProvider>
    )
}
