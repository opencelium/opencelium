import React, { useMemo, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Select } from '@/shared/ui/primitives/Select';
import { FormControl } from "@shared/ui/form/FormControl";
import { useFetchEntitiesQuery } from "@/shared/api/genericApi";
import type {SelectProps} from "@shared/ui/primitives/Select/Select.types.ts";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import type {FormControlProps} from "@shared/ui/form/FormControl/FormControl.type.ts";

interface FormSelectProps<T = string> extends SelectProps<T>, Omit<FormControlProps, "children">{
}

export function FormSelect<T>({
    name,
    label,
    labelKey,
    placeholder,
    options: staticOptions = [],
    readOnly,
    hint,
    multiple,
    asyncOptions,
    info,
    autoFocus,
    createOptionUrl,
    creatable,
    onCreate,
}: FormSelectProps<T>) {
    const {
        control,
        formState,
        getFieldState,
    } = useFormContext();

    const { t } = useI18n('error');
    const {
        data: remoteData,
        isLoading,
        isFetching,
        isError,
        error: apiError,
        refetch,
    } = useFetchEntitiesQuery(
        asyncOptions?.url ?? '',
        { skip: !asyncOptions?.url },
        {
            ignoreError: true,
        }
    );

    const finalOptions = useMemo(() => {
        if (asyncOptions?.map && remoteData) {
            try {
                return asyncOptions.map(remoteData);
            } catch (e) {
                return staticOptions;
            }
        }
        return staticOptions;
    }, [remoteData, staticOptions, asyncOptions]);

    const { error: rhfFieldError } = getFieldState(name, formState);
    const rhfError = rhfFieldError?.message as string | undefined;

    const apiErrorMessage = isError
        ? ((apiError as any)?.data?.message || t('field.failedAsyncOptions'))
        : undefined;

    const displayError = rhfError || apiErrorMessage;

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormControl
                    label={label}
                    labelKey={labelKey}
                    hint={hint}
                    error={displayError}
                    name={name}
                    info={info}
                >
                    <Select
                        creatable={creatable}
                        onCreate={onCreate}
                        createOptionUrl={createOptionUrl}
                        multiple={multiple}
                        readOnly={readOnly}
                        value={field.value}
                        onChange={field.onChange}
                        options={finalOptions}
                        placeholder={placeholder}
                        selectRef={field.ref}
                        isLoading={isLoading || isFetching}
                        autoFocus={autoFocus}
                        onRefresh={asyncOptions?.url && asyncOptions?.refreshable ? refetch : undefined}
                    />
                </FormControl>
            )}
        />
    );
}
