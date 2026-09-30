import React from "react";


export interface DividerProps {
    placement?: 'left' | 'center' | 'right'
    /** Label rendered inside the divider; both implementations forward it. */
    children?: React.ReactNode
}

export type DividerComponent = React.FC<DividerProps>;
