import React, {CSSProperties} from "react";

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg';

export interface LoadingProps {
    size?: LoadingSize;
    inline?: boolean;
    fullscreen?: boolean;
    style?: CSSProperties | undefined;
}

export type LoadingComponent = React.FC<LoadingProps>;
