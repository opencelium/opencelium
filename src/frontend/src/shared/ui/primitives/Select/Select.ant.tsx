import React, { useState } from 'react';
import { Select as AntSelect } from 'antd';
import {
    DownOutlined,
    UpOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { isGroupedOptions, type SelectComponent } from './Select.types';
import './select.ant.css';

export const AntSelectImpl: SelectComponent = ({
    value,
    defaultValue,
    disabled,
    options = [],
    placeholder,
    onChange,
    readOnly,
    multiple,
    creatable,
    createOptionUrl,
    onCreate,
    selectRef,
    isLoading,
    autoFocus,
    onRefresh,
    sortOptions = true,
    testId,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const suffixIcon = onRefresh ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ReloadOutlined
                spin={isLoading}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isLoading) onRefresh();
                }}
                style={{ cursor: isLoading ? 'default' : 'pointer' }}
            />
            {isOpen ? <UpOutlined /> : <DownOutlined />}
        </span>
    ) : undefined;

    const handleCreate = async () => {
        if (!inputValue) return;

        let newOption = {
            label: inputValue,
            value: inputValue,
        };

        if (onCreate) {
            newOption = await onCreate(inputValue);
        }

        if (multiple) {
            const currentValue = Array.isArray(value) ? value : [];
            onChange?.([...currentValue, newOption.value]);
        } else {
            onChange?.(newOption.value);
        }

        setInputValue('');
    };

    const flatOptions = isGroupedOptions(options) ? options.flatMap((group) => group.options) : options;

    const mapLeaf = (opt: (typeof flatOptions)[number]) => ({
        value: opt.value,
        label: opt.label,
        disabled: opt.disabled,
        searchLabel: opt.searchLabel,
    });
    const sortText = (opt: ReturnType<typeof mapLeaf>) =>
        opt.searchLabel ?? (typeof opt.label === 'string' ? opt.label : '');
    const sortLeaves = (leaves: ReturnType<typeof mapLeaf>[]) =>
        sortOptions ? [...leaves].sort((a, b) => sortText(a).localeCompare(sortText(b))) : leaves;

    const antOptions = isGroupedOptions(options)
        ? options.map((group) => ({
              label: group.label,
              options: sortLeaves(group.options.map(mapLeaf)),
          }))
        : sortLeaves(flatOptions.map(mapLeaf));

    return (
        <AntSelect
            ref={selectRef}
            autoFocus={autoFocus}
            data-testid={testId}
            style={{ width: '100%' }}
            className="ant-select-custom"
            value={isLoading || !value ? null : value}
            defaultValue={defaultValue}
            disabled={disabled || readOnly || isLoading}
            placeholder={placeholder}
            mode={multiple ? 'multiple' : undefined}
            showSearch
            filterOption={(input, option) => {
                const text =
                    (option as { searchLabel?: string })?.searchLabel ??
                    (typeof option?.label === 'string' ? option.label : '');
                return text.toLowerCase().includes(input.toLowerCase());
            }}
            onSearch={setInputValue}
            onChange={onChange}
            onDropdownVisibleChange={setIsOpen}
            suffixIcon={suffixIcon}
            loading={isLoading}
            options={antOptions}
            dropdownRender={(menu) => (
                <>
                    {createOptionUrl && (
                        <div
                            style={{
                                padding: 8,
                                borderBottom: '1px solid var(--color-border-subtle)',
                                cursor: 'pointer',
                                color: 'var(--color-action-primary)',
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => window.open(createOptionUrl, '_blank', 'noopener,noreferrer')}
                        >
                            + Create new
                        </div>
                    )}
                    {menu}
                    {creatable && inputValue && !flatOptions.some(o => o.label === inputValue) && (
                        <div
                            style={{
                                padding: 8,
                                borderTop: '1px solid var(--color-border-subtle)',
                                cursor: 'pointer',
                                color: 'var(--color-action-primary)'
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleCreate}
                        >
                            + Create "{inputValue}"
                        </div>
                    )}
                </>
            )}
        />
    );
};
