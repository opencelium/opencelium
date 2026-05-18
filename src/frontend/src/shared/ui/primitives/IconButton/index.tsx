import React from "react";
import { Button } from '../Button';
import { Icon } from '../Icon';
import type { IconButtonProps } from './IconButton.types';
import './iconButton.css';

export const IconButton: React.FC<IconButtonProps> = ({
    iconProps,
    loading,
    size = 'sm',
    ...rest
}) => {
    const sizeMap = {
        xs: 16,
        sm: 22,
        md: 40,
        lg: 48,
    };
    return (
        <Button {...rest} loading={loading} style={{
        }}>
            <span
                className="icon-button__content"

                style={{
                    width: sizeMap[size],
                    height: sizeMap[size],
                }}
            >
                {!loading && <Icon {...iconProps} size={sizeMap[size] - 4} />}
            </span>
        </Button>
    );
};
