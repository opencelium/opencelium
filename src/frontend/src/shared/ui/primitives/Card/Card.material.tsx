import React from 'react';
import {
    Card as MuiCard,
    CardContent,
    CardHeader,
    CardActions,
} from '@mui/material';

import type { CardComponent } from './Card.types';

export const MaterialCard: CardComponent = ({
    title,
    extra,
    footer,
    bordered = true,
    elevated = true,
    className = '',
    children,
    style,
}) => {
    return (
        <MuiCard
            style={style}
            className={className}
            elevation={elevated ? 3 : 0}
            sx={{
                border: bordered
                    ? '1px solid var(--color-border-default)'
                    : 'none',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-background-surface)',
            }}
        >
            {(title || extra) && (
                <CardHeader
                    title={title}
                    action={extra}
                />
            )}

            <CardContent>{children}</CardContent>

            {footer && <CardActions>{footer}</CardActions>}
        </MuiCard>
    );
};
