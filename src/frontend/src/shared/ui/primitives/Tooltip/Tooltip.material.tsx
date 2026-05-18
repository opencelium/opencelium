import React from 'react';
import { Tooltip as MuiTooltip } from '@mui/material';
import type { TooltipComponent } from './Tooltip.types';

export const MaterialTooltip: TooltipComponent = ({
    content,
    placement = 'top',
    children,
}) => {
    return (
        <MuiTooltip
            title={content}
            placement={placement}
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
