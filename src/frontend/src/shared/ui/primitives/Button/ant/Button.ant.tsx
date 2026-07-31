import React, {CSSProperties} from 'react';
import { Button as AntButtonBase } from 'antd';
import type { AntButtonVariant, ButtonComponent } from '../Button.types.ts';

const ANT_VARIANTS: readonly AntButtonVariant[] = ['outlined', 'dashed', 'solid', 'filled', 'text', 'link'];
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
    testId,
   ...rest
}) => {
    // `minWidth: 51px` is a default floor for text-only buttons, not a mandate —
    // a caller's own `style` (e.g. IconButton's fixed-size icon-only override)
    // must be able to override it, so it's applied first and merged under.
    const additionalStyles: CSSProperties = {minWidth: '51px'};
    style = style ? {...additionalStyles, ...style} : additionalStyles;
    // antd only understands its own variants; semantic ones (primary/secondary/
    // danger) are handled by the material/custom impls, so drop them here.
    const antVariant = variant && ANT_VARIANTS.includes(variant as AntButtonVariant)
        ? (variant as AntButtonVariant)
        : undefined;
    return (
        <AntButtonBase
            {...rest}
            data-testid={testId}
            style={style}
            loading={false}
            color={color}
            variant={antVariant}
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
