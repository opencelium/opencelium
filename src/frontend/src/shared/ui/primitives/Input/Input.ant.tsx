import { Input as AntInputBase } from 'antd';
import type { InputRef } from 'antd';
import type { InputProps } from './Input.types';
import './input.ant.css';
import {forwardRef} from "react";
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";
import {useRemoteValidationStore} from "@shared/form/remoteValidationStore.ts";

export const AntInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
    const {
        error,
        inputRef,
        type,
        name,
        disabled,
        readOnly,
        variant,
        rightSlot,
        leftSlot,
        testId,
        ...rest
    } = props;
    const isLoading = useRemoteValidationStore(
        (s) => name ? s.loadingFields[name] : false
    )
    const setInputRef = (node: InputRef | null) => {
        const input = node?.input ?? null;

        for (const targetRef of [ref, inputRef]) {
            if (typeof targetRef === 'function') {
                targetRef(input);
            } else if (targetRef) {
                targetRef.current = input;
            }
        }
    };

    const inputProps = {
        ...rest,
        name,
        variant: variant === 'default' ? undefined : variant,
        'data-testid': testId,
        status: error ? 'error' as const : undefined,
        className: 'ant-input-custom',
        disabled: disabled || readOnly,
        addonAfter: rightSlot,
        addonBefore: leftSlot,
    };

    return (
        <div style={{width: '100%', position: 'relative'}}>
            {type === 'password' ? (
                <AntInputBase.Password {...inputProps} ref={setInputRef}/>
            ) : (
                <AntInputBase {...inputProps} type={type} ref={setInputRef}/>
            )}
            {isLoading && <div style={{position: 'absolute', right: 10, top: 6}}>
                <Loading inline size={'sm'}/>
            </div>}
        </div>
    );
});
