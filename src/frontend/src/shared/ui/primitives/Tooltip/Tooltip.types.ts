import React from 'react';
import type { ReactNode } from 'react';

export type TooltipPlacement =
    | 'top'
    | 'bottom'
    | 'left'
    | 'right';

export interface TooltipProps {
    content: ReactNode;
    placement?: TooltipPlacement;
    children: ReactNode;
}

export type TooltipComponent = React.FC<TooltipProps>;
