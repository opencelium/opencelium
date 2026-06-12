import { Input as AntInputBase } from 'antd';
import type { InputComponent } from './Input.types';
import './input.ant.css';
import {forwardRef} from "react";
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";
import {useRemoteValidationStore} from "@shared/form/remoteValidationStore.ts";

export const AntInput = forwardRef<any, InputComponent>((props, ref) => {
    const {
        error,
        inputRef,
        type,
        name,
        rightSlot,
        leftSlot,
        testId,
        ...rest
    } = props;
    const isLoading = useRemoteValidationStore(
        (s) => s.loadingFields[name]
    )
    const InputComponent = type === 'password' ? AntInputBase.Password : AntInputBase;
    return (
        <div style={{width: '100%', position: 'relative'}}>
            <InputComponent
                {...rest}
                data-testid={testId}
                ref={(node) => {
                    if (!node) return;

                    const input = node?.input ?? node;

                    if (typeof ref === 'function') {
                        ref(input);
                    } else if (ref) {
                        ref.current = input;
                    }
                }}
                status={error ? 'error' : undefined}
                className="ant-input-custom"
                addonAfter={rightSlot}
                addonBefore={leftSlot}
            />
            {isLoading && <div style={{position: 'absolute', right: 10, top: 6}}>
                <Loading inline size={'sm'}/>
            </div>}
        </div>
    );
});
