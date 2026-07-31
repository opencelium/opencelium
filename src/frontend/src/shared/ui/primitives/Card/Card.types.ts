import type { ReactNode } from 'react';
import React from "react";

export interface CardProps {
    id?: string,
    title?: ReactNode;
    extra?: ReactNode;
    footer?: ReactNode;

    bordered?: boolean;
    elevated?: boolean;

    children?: ReactNode;

    className?: string;

    style?: React.CSSProperties,
}

export type CardComponent = React.FC<CardProps>;
