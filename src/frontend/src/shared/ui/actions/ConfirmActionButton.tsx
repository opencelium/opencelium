import React, { useState } from 'react';
import { Button } from '@/shared/ui/primitives/Button';
import { useConfirm } from '@/shared/ui/confirm/ConfirmDialogContext';
import type { ConfirmActionButtonProps } from './ConfirmActionButton.types';

export const ConfirmActionButton: React.FC<ConfirmActionButtonProps> = ({
    confirm,
    onConfirm,
    variant = 'primary',
    disabled,
    loading: externalLoading,
    children,
}) => {
    const confirmAction = useConfirm();
    const [internalLoading, setInternalLoading] = useState(false);

    const loading = externalLoading ?? internalLoading;

    const handleClick = async () => {
        const ok = confirm ? await confirmAction(confirm) : true;
        if (!ok) return;

        try {
            setInternalLoading(true);
            await onConfirm();
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            disabled={disabled || loading}
            onClick={handleClick}
        >
            {loading ? '…' : children}
        </Button>
    );
};
