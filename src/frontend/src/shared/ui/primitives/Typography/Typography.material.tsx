import React from 'react';
import { Typography as MuiTypography } from '@mui/material';
import type { TypographyComponent } from './Typography.types';

const variantMap = {
    body: 'body1',
    caption: 'caption',
    label: 'subtitle2',
    title: 'h5',
    subtitle: 'h6',
} as const;

export const MaterialTypography: TypographyComponent = ({
    children,
    variant = 'body',
    as,
    isBold,
}) => {
    const style = {fontWeight: isBold ? '500' : 'normal'};
    if (as) {
        const Tag = as as React.ElementType;
        return <Tag style={style}>{children}</Tag>;
    }
    return (
        <MuiTypography variant={variantMap[variant]} style={style}>
            {children}
        </MuiTypography>
    );
};
