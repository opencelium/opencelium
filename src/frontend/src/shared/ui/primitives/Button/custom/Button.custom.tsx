import React from 'react';
import './button.custom.css';
import type {ButtonComponent} from "@shared/ui/primitives/Button/Button.types.ts";
import {Icon} from "@shared/ui/primitives/Icon";
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";

export const CustomButton: ButtonComponent =
    ({
        loading = false,
        variant = 'primary',
        disabled,
        children,
        iconLeft,
        iconRight,
        onClick,
    }) => {
    return (
        <button className={`btn btn-${variant}`} onClick={onClick}>
            <span className="custom-btn-content">
                {!loading && iconLeft && (
                    <Icon name={iconLeft} size={16} color="inherit"/>
                )}
                {loading && <Loading size="xs" inline/>}
                {children}
                {!loading && iconRight && (
                    <Icon name={iconRight} size={16} color="inherit"/>
                )}
            </span>
        </button>
    )
}
