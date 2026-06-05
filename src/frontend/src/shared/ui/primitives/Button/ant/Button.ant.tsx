import React, {CSSProperties} from 'react';
import { Button as AntButtonBase } from 'antd';
import type { ButtonComponent } from '../Button.types.ts';
import './button.ant.css';
import {Icon} from "@shared/ui/primitives/Icon";
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";

export const AntButton: ButtonComponent = ({
    loading = false,
    variant,
    disabled,
    children,
    iconLeft,
    iconRight,
    color,
    style,
   ...rest
}) => {
    const additionalStyles: CSSProperties = {minWidth: '51px'};
    style = style ? {...style, ...additionalStyles} : additionalStyles;
    return (
        <AntButtonBase
            {...rest}
            style={style}
            loading={false}
            color={color}
            variant={variant}
            disabled={disabled || loading}
        >
            {!loading && iconLeft && (
                <Icon name={iconLeft} size={16} color="inherit"/>
            )}
            {loading && <div style={{display: 'inline', marginRight: 5} }><Loading size="xs" inline /></div>}
            {children}
            {!loading && iconRight && (
                <Icon name={iconRight} size={16} color="inherit"/>
            )}
        </AntButtonBase>
);
};
