import React from "react";
import { Button } from '../Button';
import { Icon } from '../Icon';
import type { IconButtonProps } from './IconButton.types';
import './iconButton.css';

const ICON_BOX_PADDING = 8;

export const IconButton: React.FC<IconButtonProps> = ({
    iconProps,
    loading,
    size = 'sm',
    style,
    ...rest
}) => {
    const sizeMap = {
        xs: 16,
        sm: 22,
        md: 40,
        lg: 48,
    };
    // iconProps.size, when explicitly given, overrides the size-derived default —
    // resolved here (rather than via prop-spread order) so an explicit `size:
    // undefined` in iconProps still falls back correctly.
    const hasCustomIconSize = iconProps.size !== undefined;
    const iconSize = iconProps.size ?? sizeMap[size] - 4;
    // When the icon size is overridden, size the button's own clickable box to
    // match (icon + fixed padding per side, mirroring the workflow logs header's
    // own icon-button CSS) instead of leaving it at the size-tier default.
    const contentSize = hasCustomIconSize ? iconSize + ICON_BOX_PADDING * 2 : sizeMap[size];

    return (
        <Button
            {...rest}
            loading={loading}
            style={
                hasCustomIconSize
                    ? { ...style, width: contentSize, height: contentSize, minWidth: contentSize, padding: 0 }
                    : style
            }
        >
            <span
                className="icon-button__content"
                style={{
                    width: contentSize,
                    height: contentSize,
                }}
            >
                {!loading && <Icon {...iconProps} size={iconSize} />}
            </span>
        </Button>
    );
};
