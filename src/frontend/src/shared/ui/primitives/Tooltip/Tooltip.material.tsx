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
    zIndex,
    maxWidth,
    variant = 'default',
    open,
    onOpenChange,
    children,
}) => {
    return (
        <MuiTooltip
            title={content}
            placement={muiPlacement[placement]}
            arrow
            open={open}
            onOpen={() => onOpenChange?.(true)}
            onClose={() => onOpenChange?.(false)}
            slotProps={{
                tooltip: {
                    sx: {
                        backgroundColor: 'var(--color-background-surface)',
                        color: 'var(--color-text-primary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                        ...(variant === 'card' && {
                            backgroundColor: 'var(--color-background-elevated)',
                            border: '1px solid var(--color-border-subtle)',
                            borderRadius: '16px',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '14px 18px 6px',
                        }),
                        ...(maxWidth && { maxWidth }),
                    },
                },
                arrow: variant === 'card' ? { sx: { color: 'var(--color-background-elevated)' } } : undefined,
                popper: zIndex ? { style: { zIndex } } : undefined,
            }}
        >
            <span style={{ display: 'inline-flex', minWidth: 0 }}>{children}</span>
        </MuiTooltip>
    );
};
