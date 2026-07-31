import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { FormControl } from '@shared/ui/form/FormControl'
import { Dropzone } from '@shared/ui/primitives/DropZone/DropZone'

interface FormFileDropZoneProps {
    name: string
    label?: string
    labelKey?: string
    hint?: string
    multiple?: boolean
    accept?: string
    disabled?: boolean
    testId?: string
}

export const FormFileDropZone: React.FC<FormFileDropZoneProps> = ({
    name,
    label,
    labelKey,
    hint,
    multiple,
    accept,
    disabled,
    testId,
}) => {
    const { control, formState } = useFormContext()
    const error = formState.errors[name]?.message as string | undefined

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormControl label={label} labelKey={labelKey} error={error} name={name} testId={testId}>
                    <Dropzone
                        multiple={multiple}
                        accept={accept}
                        disabled={disabled}
                        hint={hint}
                        testId={testId}
                        onFiles={(files) =>
                            field.onChange(multiple ? files : (files[0] ?? null))
                        }
                    />
                </FormControl>
            )}
        />
    )
}
