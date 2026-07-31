import React, {CSSProperties} from "react";


export interface FieldContainerProps {
    style?: CSSProperties | undefined;
    isEmpty?: boolean;
}

export type FieldContainerComponent = React.FC<FieldContainerProps>;
