import React from 'react';
import { Box, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import type { EmptyComponent } from '../Empty.types';

export const MaterialEmpty: EmptyComponent = ({ description, image, children, className, style }) => {
    return (
        <Box
            className={className}
            style={style}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                padding: '24px 8px',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
            }}
        >
            {image === undefined ? <InboxOutlinedIcon sx={{ fontSize: 48, opacity: 0.45 }} /> : image}
            {description != null && (
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            )}
            {children}
        </Box>
    );
};
