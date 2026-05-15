import React from 'react';
import {
    Dialog as MuiDialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import type { DialogComponent } from './Dialog.types';

export const MaterialDialog: DialogComponent = ({
    open,
    onClose,
    title,
    footer,
    children,
    width = 480,
    closable = true,
    fullscreen = false,
    afterClose,
}) => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    fullscreen = fullscreen || isMobile;
    return (
        <MuiDialog
            open={open}
            onClose={closable ? onClose : undefined}
            TransitionProps={afterClose ? { onExited: afterClose } : undefined}
            fullScreen={fullscreen}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width,
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: fullscreen ? 0 : '40px',
                },
            }}
        >
            {title && <DialogTitle>{title}</DialogTitle>}

            <DialogContent dividers>
                {children}
            </DialogContent>

            {footer && (
                <DialogActions>
                    {footer}
                </DialogActions>
            )}
        </MuiDialog>
    );
};
