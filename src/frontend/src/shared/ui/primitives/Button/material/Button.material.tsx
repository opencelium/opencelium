import React from 'react';
import {Button as MuiButton} from '@mui/material';
import type { ButtonComponent } from './Button.types';
import {Icon} from "@shared/ui/primitives/Icon";
import './button.material.css';
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";

const variantMap = {
    primary: 'contained',
    secondary: 'outlined',
    danger: 'contained',
} as const;

export const MaterialButton: ButtonComponent = ({
    loading = false,
    disabled,
    variant = 'primary',
    children,
    iconLeft,
    iconRight,
    ...rest
}) => {
    return (
        <MuiButton
            variant={variantMap[variant]}
            {...rest}
            disabled={disabled || loading}
            sx={{
                position: 'relative',
                backgroundColor:
                    variant === 'primary'
                        ? 'var(--color-action-primary)'
                        : variant === 'danger'
                            ? 'var(--color-action-danger)'
                            : 'transparent',

                color:
                    variant === 'secondary'
                        ? 'var(--color-action-primary)'
                        : 'var(--color-text-on-action)',

                borderRadius: 'var(--radius-md)',

                '&:hover': {
                    backgroundColor:
                        variant === 'primary'
                            ? 'var(--color-action-primary-hover)'
                            : variant === 'danger'
                                ? 'var(--color-action-danger-hover)'
                                : 'var(--color-background-hover)',
                },
            }}
        >
          <span className="button-content">
                {loading && (
                    <Loading size="xs" inline />
                )}

              {!loading && iconLeft && (
                  <Icon name={iconLeft} size={16} color="inherit"/>
              )}
              <span style={{opacity: loading ? 0.7 : 1}}>
                        {children}
                    </span>
              {!loading && iconRight && (
                  <Icon name={iconRight} size={16} color="inherit"/>
              )}
          </span>
        </MuiButton>
);
};
