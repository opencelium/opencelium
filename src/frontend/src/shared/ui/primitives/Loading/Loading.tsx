import React from 'react';
import './Loading.css';
import type { LoadingProps } from './Loading.types';

export const Loading: React.FC<LoadingProps> = ({
    size = 'md',
    inline,
    fullscreen,
    style,
}) => {
    const spinner = (
        <span className={`loading loading--${size}`} style={style}>
            <i /><i /><i /><i />
        </span>
    );

    if (fullscreen) {
        return <div className="loading--fullscreen" style={style}>{spinner}</div>;
    }

    if (inline) {
        return spinner;
    }

    return <div style={style}>{spinner}</div>;
};
