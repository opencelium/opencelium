import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { findGlobalReferences } from '@entities/globalVariable/lib/globalReference';
import { GlobalTextPreview } from '@entities/globalVariable/ui/picker/GlobalTextPreview';
import { GlobalVariableInsertButton } from '@entities/globalVariable/ui/picker/GlobalVariableInsertButton';
import type { PickerScope } from '@entities/globalVariable/model/types';
import { FormControl } from '@shared/ui/form/FormControl';
import { Input } from '@shared/ui/primitives/Input';

type Props = {
    fieldKey: string;
    label: string;
    error?: string;
    isPassword: boolean;
    hasAccess: boolean;
    canInsertGlobals: boolean;
    autoFocus: boolean;
    scope: PickerScope;
};

type OverlayRect = Pick<CSSProperties, 'left' | 'top' | 'width' | 'height' | 'paddingLeft' | 'paddingRight'
    | 'borderTopLeftRadius' | 'borderBottomLeftRadius' | 'borderTopRightRadius' | 'borderBottomRightRadius'>;

/**
 * A credential input that, while not being edited, draws its `{{global.x}}` references as chips
 * (a constant shows its value). The chips cover the input only visually: the form keeps the raw
 * text, so the connector is saved with the references as they are.
 */
export function CredentialField({ fieldKey, label, error, isPassword, hasAccess, canInsertGlobals, autoFocus, scope }: Props) {
    const name = `requestData.${fieldKey}`;
    const { control, getValues, setValue } = useFormContext();
    const [isFocused, setFocused] = useState(false);
    const [overlayRect, setOverlayRect] = useState<OverlayRect>();
    const boxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // The input shares its box with the globe addon and, for a password, the eye icon: measure the
    // text area itself (inside its border, with its padding) so the preview never covers those.
    // Client rects are exact whatever antd wraps the input in; dividing by the box's scale undoes a
    // dialog's opening zoom.
    useLayoutEffect(() => {
        const input = inputRef.current;
        const box = boxRef.current;
        if (!input || !box) return;
        const measure = () => {
            const boxRect = box.getBoundingClientRect();
            const inputRect = input.getBoundingClientRect();
            const scale = box.offsetWidth > 0 ? boxRect.width / box.offsetWidth : 1;
            const style = window.getComputedStyle(input);
            setOverlayRect({
                left: (inputRect.left - boxRect.left) / scale + input.clientLeft,
                top: (inputRect.top - boxRect.top) / scale + input.clientTop,
                width: input.clientWidth, height: input.clientHeight,
                paddingLeft: style.paddingLeft, paddingRight: style.paddingRight,
                // Keeps the input's rounded corners visible under the preview.
                borderTopLeftRadius: style.borderTopLeftRadius, borderBottomLeftRadius: style.borderBottomLeftRadius,
                borderTopRightRadius: style.borderTopRightRadius, borderBottomRightRadius: style.borderBottomRightRadius,
            });
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(input);
        return () => observer.disconnect();
    }, [isPassword, canInsertGlobals]);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const value = String(field.value ?? '');
                const hasPreview = hasAccess && !isFocused && overlayRect !== undefined
                    && findGlobalReferences(value).length > 0;
                return (
                    <FormControl label={label} error={error} name={name}>
                        <div ref={boxRef} style={{ position: 'relative', width: '100%' }}>
                            <Input
                                name={name}
                                type={isPassword ? 'password' : 'text'}
                                value={value}
                                onChange={(event) => field.onChange(event.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => {
                                    setFocused(false);
                                    field.onBlur();
                                }}
                                inputRef={inputRef}
                                placeholder={hasAccess ? '' : '**************'}
                                error={!!error}
                                autoFocus={autoFocus}
                                disabled={!hasAccess}
                                testId={`connector-request-data-${fieldKey}`}
                                rightSlot={canInsertGlobals ? (
                                    <GlobalVariableInsertButton
                                        scope={scope}
                                        testId={`connector-request-data-global-${fieldKey}`}
                                        onInsert={(reference) => setValue(name, `${getValues(name) ?? ''}${reference}`, { shouldDirty: true })}
                                    />
                                ) : undefined}
                            />
                            {hasPreview && (
                                <div
                                    data-testid={`connector-request-data-preview-${fieldKey}`}
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        inputRef.current?.focus();
                                    }}
                                    style={{
                                        position: 'absolute', ...overlayRect, boxSizing: 'border-box', display: 'flex', alignItems: 'center',
                                        overflow: 'hidden', cursor: 'text', background: 'var(--color-background-input)',
                                    }}
                                >
                                    <GlobalTextPreview text={value} isMasked={isPassword} />
                                </div>
                            )}
                        </div>
                    </FormControl>
                );
            }}
        />
    );
}
