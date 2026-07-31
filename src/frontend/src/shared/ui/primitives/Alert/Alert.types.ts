import type {CSSProperties, ReactNode} from "react";
import React from "react";

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
    type?: AlertType;
    message: ReactNode;
    description?: ReactNode;
    showIcon?: boolean;
    closable?: boolean;
    onClose?: () => void;
    action?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export type AlertComponent = React.FC<AlertProps>;
