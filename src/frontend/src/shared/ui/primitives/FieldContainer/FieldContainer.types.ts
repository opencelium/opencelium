import React, {CSSProperties} from "react";


export interface FieldContainerProps {
    style?: CSSProperties | undefined;
    isEmpty?: boolean;
    children?: React.ReactNode;
}

export type FieldContainerComponent = React.FC<FieldContainerProps>;
