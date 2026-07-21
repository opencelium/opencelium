import React, { useState } from 'react';
import {
    TextField,
    Autocomplete,
    createFilterOptions,
    IconButton,
    ListSubheader,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { isGroupedOptions, type SelectComponent } from './Select.types';

const filter = createFilterOptions<any>();

export const MaterialSelect: SelectComponent = ({
    value,
    defaultValue,
    disabled,
    options,
    placeholder,
    onChange,
    readOnly,
    multiple,
    creatable,
    createOptionUrl,
    onCreate,
    onRefresh,
    isLoading,
    testId,
}) => {
    const [inputValue, setInputValue] = useState('');

    const handleChange = async (_: any, newValue: any) => {
        // multiple
        if (multiple) {
            const last = newValue[newValue.length - 1];

            if (last?.isCreateExternal) {
                window.open(createOptionUrl, '_blank', 'noopener,noreferrer');
                return;
            }

            if (last?.inputValue) {
                const created = onCreate
                    ? await onCreate(last.inputValue)
                    : { label: last.inputValue, value: last.inputValue };

                onChange?.([
                    ...newValue.slice(0, -1).map((v: any) => v.value),
                    created.value,
                ]);
                return;
            }

            onChange?.(newValue.map((v: any) => v.value));
        } else {
            // single
            if (newValue?.isCreateExternal) {
                window.open(createOptionUrl, '_blank', 'noopener,noreferrer');
                return;
            }

            if (newValue?.inputValue) {
                const created = onCreate
                    ? await onCreate(newValue.inputValue)
                    : { label: newValue.inputValue, value: newValue.inputValue };

                onChange?.(created.value);
                return;
            }

            onChange?.(newValue?.value ?? null);
        }
    };

    const grouped = isGroupedOptions(options);
    const flatOptions = grouped
        ? options.flatMap((group) => group.options.map((opt) => ({ ...opt, __group: String(group.label) })))
        : options;

    const mappedValue = multiple
        ? flatOptions.filter((opt) => value?.includes(opt.value))
        : flatOptions.find((opt) => opt.value === value) || null;

    return (
        <Autocomplete
            multiple={multiple}
            freeSolo={creatable}
            disabled={disabled || readOnly}
            options={flatOptions}
            groupBy={grouped ? (option: any) => option.__group : undefined}
            renderGroup={(params) => (
                <li key={params.key}>
                    <ListSubheader component="div">{params.group}</ListSubheader>
                    {params.children}
                </li>
            )}
            value={mappedValue}
            onChange={handleChange}
            inputValue={inputValue}
            onInputChange={(_, newInput) => setInputValue(newInput)}
            filterOptions={(opts, params) => {
                const filtered = filter(opts, params);

                if (createOptionUrl) {
                    filtered.unshift({
                        isCreateExternal: true,
                        label: '+ Create new',
                    });
                }

                if (
                    creatable &&
                    params.inputValue !== '' &&
                    !opts.some((opt) => opt.label === params.inputValue)
                ) {
                    filtered.push({
                        inputValue: params.inputValue,
                        label: `Create "${params.inputValue}"`,
                    });
                }

                return filtered;
            }}
            getOptionLabel={(option: any) => {
                if (typeof option === 'string') return option;
                if (option.isCreateExternal) return '';
                if (option.inputValue) return option.inputValue;
                return option.searchLabel ?? (typeof option.label === 'string' ? option.label : '');
            }}
            renderOption={(props, option) => {
                const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & {
                    key?: React.Key;
                };
                return (
                    <li key={key} {...rest}>
                        {option.label}
                    </li>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={placeholder}
                    inputProps={{ ...params.inputProps, 'data-testid': testId }}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {onRefresh && (
                                    <IconButton
                                        size="small"
                                        disabled={isLoading}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRefresh();
                                        }}
                                    >
                                        <RefreshIcon fontSize="small" />
                                    </IconButton>
                                )}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
};
