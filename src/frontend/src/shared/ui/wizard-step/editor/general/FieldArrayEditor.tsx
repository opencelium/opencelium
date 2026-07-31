import React, { useState, useEffect, useRef } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import type { RegisterOptions } from 'react-hook-form';
import { Button } from '@shared/ui/primitives/Button';
import { EntityText } from '@shared/ui/primitives/Text';
import { Collapse } from '@shared/ui/primitives/Collapse';
import FormFieldContainer from "@shared/ui/form/FormFieldContainer";
import EmptyData from "@shared/ui/wizard-step/editor/general/EmptyData.tsx";

type Variant = 'default' | 'nested' | 'compact';

interface FieldArrayEditorProps<T> {
    name: string;
    label?: string;
    error?: string;
    hint?: string,
    required?: boolean

    defaultItem: T;

    renderItem: (params: {
        item: any;
        index: number;
        remove: (index: number) => void;
    }) => React.ReactNode;

    renderHeader?: (params: {
        item: any;
        index: number;
        remove: (index: number) => void;
    }) => React.ReactNode;

    collapsible?: boolean;
    defaultCollapsed?: boolean;

    // UI
    emptyText?: string;
    addButtonText?: string;

    variant?: Variant;

    hideLabel?: boolean;
    hideAddButton?: boolean;

    addButtonPosition?: 'bottom' | 'top';

    gap?: number;

    rules?: Pick<RegisterOptions, 'maxLength' | 'minLength' | 'validate' | 'required'>;
}

export const FieldArrayEditor = <T,>({
    name,
    label,
    error,
    hint,
    defaultItem,
    renderItem,
    renderHeader,
    required,
    emptyText = 'No items yet.',
    addButtonText = 'Add',

    variant = 'default',
    collapsible = false,
    defaultCollapsed = false,
    hideLabel,
    hideAddButton,

    addButtonPosition = 'bottom',
    gap = 14,
    rules,
}: FieldArrayEditorProps<T>) => {
    const { control } = useFormContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name,
        rules,
    });

    const [activeKeys, setActiveKeys] = useState<string[]>(() =>
        defaultCollapsed ? [] : fields.map(f => f.id)
    );

    const fieldIdsKey = fields.map(f => f.id).join(',');
    const prevFieldIdsRef = useRef<string[]>(fields.map(f => f.id));
    useEffect(() => {
        const prevIds = prevFieldIdsRef.current;
        const currentIds = fields.map(f => f.id);
        prevFieldIdsRef.current = currentIds;

        const added = currentIds.filter(id => !prevIds.includes(id));
        if (added.length === 0 && prevIds.length === currentIds.length) return;

        setActiveKeys(prev => {
            let next = prev.filter(k => currentIds.includes(k));
            if (!defaultCollapsed && added.length > 0) {
                next = [...next, ...added];
            }
            return next;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldIdsKey]);

    const isCompact = variant === 'compact';

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    };

    const listStyle: React.CSSProperties = {
        display: 'grid',
        gap: isCompact ? 0 : gap,
    };

    const wrapItem = (content: React.ReactNode, key: string) => {
        if (isCompact) {
            return (
                <div key={key} style={{ padding: 8 }}>
                    {content}
                </div>
            );
        }
        return (
            <FormFieldContainer
                key={key}
                fieldContainerProps={{ style: { position: 'relative' } }}
            >
                {content}
            </FormFieldContainer>
        );
    };

    const renderAddButton = (isEmpty = false) => {
        if (hideAddButton) return null;
        return (
            <div style={{ display: 'flex', justifyContent: isEmpty ? 'center' : 'left', padding: isCompact ? 8 : '8px 0' }}>
                <Button
                    size={'md'}
                    onClick={() => append(defaultItem)}
                >
                    {addButtonText}
                </Button>
            </div>
        );
    };

    const AddButton = addButtonPosition === 'bottom' ? renderAddButton(fields.length === 0) : null;
    const ListWrapper = isCompact ? FormFieldContainer : 'div';
    const listWrapperProps = isCompact ? { fieldContainerProps: { style: listStyle }, error } : { style: listStyle };

    const renderList = () => {
        if (collapsible && renderHeader) {
            return (
                <>
                    <Collapse
                        items={fields.map((item, index) => ({
                            key: item.id,
                            label: renderHeader({ item, index, remove }),
                            content: renderItem({ item, index, remove }),
                        }))}
                        activeKeys={activeKeys}
                        onChange={setActiveKeys}
                    />
                    {AddButton}
                </>
            );
        }

        return (
            <ListWrapper {...listWrapperProps}>
                {fields.map((item, index) =>
                    wrapItem(renderItem({ item, index, remove }), item.id)
                )}
                {AddButton}
            </ListWrapper>
        );
    };

    return (
        <div style={containerStyle}>
            {label && (
                <label className="form-control__label">
                    <span style={{ position: 'relative' }}>
                        <EntityText typoProps={{ isBold: true }} i18nKey={label} />
                    </span>
                    {required && (
                        <span className="form-control__required">*</span>
                    )}
                </label>
            )}

            {addButtonPosition === 'top' && renderAddButton()}

            {fields.length === 0 ? (
                <EmptyData description={emptyText} hasError={!!error}>
                    {AddButton}
                </EmptyData>
            ) : renderList()}

            {(!isCompact || fields.length === 0) && (
                <div style={{ minHeight: '20px' }}>
                    {error ? (
                        <div className="form-control__error">
                            {typeof error === 'string'
                                ? <EntityText i18nKey={error} typoProps={{ isDanger: true }} />
                                : <span>{error}</span>
                            }
                        </div>
                    ) : hint ? (
                        <div className="form-control__hint">
                            <EntityText i18nKey={hint} />
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};
