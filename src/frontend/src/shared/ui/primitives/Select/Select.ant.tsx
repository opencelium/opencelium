import React, { useState } from 'react';
import { Select as AntSelect } from 'antd';
import {
    DownOutlined,
    UpOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import type { SelectComponent } from './Select.types';
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
    return (
        <AntSelect
            ref={selectRef}
            autoFocus={autoFocus}
            style={{ width: '100%' }}
            className="ant-select-custom"
            value={isLoading || !value ? null : value}
            defaultValue={defaultValue}
            disabled={disabled || readOnly || isLoading}
            placeholder={placeholder}
            mode={multiple ? 'multiple' : undefined}
            showSearch={{
                optionFilterProp: 'label'
            }}
            onSearch={setInputValue}
            onChange={onChange}
            onDropdownVisibleChange={setIsOpen}
            suffixIcon={suffixIcon}
            loading={isLoading}
            options={(() => {
                const mapped = options.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                    disabled: opt.disabled,
                }));
                return sortOptions
                    ? mapped.sort((a, b) => a.label.localeCompare(b.label))
                    : mapped;
            })()}
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
                    {creatable && inputValue && !options.some(o => o.label === inputValue) && (
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
