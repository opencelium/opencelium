import React from 'react';
import type { ButtonProps } from './Button.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export const Button = React.forwardRef<
    HTMLButtonElement,
    ButtonProps
>((props, ref) => {
    const { Button: Impl } = useDynamicUI();
    return <Impl {...props} ref={ref} />;
});
