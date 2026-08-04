import React from "react";


export interface StepsProps {
    current: number,
    status?: 'wait' | 'process' | 'finish' | 'error',
    items: {
        header: React.ReactNode,
        subheader?: React.ReactNode,
        content?: React.ReactNode,
        status?: 'wait' | 'process' | 'finish' | 'error';
        onClick?: React.MouseEventHandler<HTMLElement>;
    }[]
}

export type StepsComponent = React.FC<StepsProps>;
