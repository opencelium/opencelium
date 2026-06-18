import React from 'react';
import { Tooltip as MuiTooltip, type TooltipProps as MuiTooltipProps } from '@mui/material';
import type { TooltipComponent, TooltipPlacement } from './Tooltip.types';

// Ant uses 'topLeft'-style names; MUI uses 'top-start'-style. Map across.
const muiPlacement: Record<TooltipPlacement, MuiTooltipProps['placement']> = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
    topLeft: 'top-start',
    topRight: 'top-end',
    bottomLeft: 'bottom-start',
    bottomRight: 'bottom-end',
};

export const MaterialTooltip: TooltipComponent = ({
    content,
    placement = 'top',
    children,
}) => {
    return (
        <MuiTooltip
            title={content}
            placement={muiPlacement[placement]}
            arrow
            slotProps={{
                tooltip: {
                    sx: {
                        backgroundColor: 'var(--color-background-surface)',
                        color: 'var(--color-text-primary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                    },
                },
            }}
        >
            <span>{children}</span>
        </MuiTooltip>
    );
};
