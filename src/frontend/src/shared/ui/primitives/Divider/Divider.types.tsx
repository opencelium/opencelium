import React from "react";


export interface DividerProps {
    placement?: 'left' | 'center' | 'right'
}

export type DividerComponent = React.FC<DividerProps>;
