import React from 'react';
import { IconButton } from '@shared/ui/primitives/IconButton';
import type { IconButtonProps } from '@shared/ui/primitives/IconButton/IconButton.types';

export type DeleteIconButtonProps = Omit<IconButtonProps, 'iconProps' | 'size' | 'type'> & {
    /** Overrides the delete icon's pixel size. Left undefined, IconButton's own xs-tier default applies. */
    iconSize?: number;
};

/** Standard delete row-action look — red "delete" icon on a text, xs-sized button. */
export const DeleteIconButton: React.FC<DeleteIconButtonProps> = ({ iconSize, ...rest }) => (
    <IconButton
        {...rest}
        type="text"
        size="xs"
        iconProps={{ name: 'delete', color: 'danger', size: iconSize }}
    />
);
