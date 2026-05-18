import React, {JSX} from "react";

export type TypographyVariant =
    | 'display'
    | 'headline'
    | 'title'
    | 'subtitle'
    | 'body'
    | 'caption'
    | 'label'
    | 'overline'
    | 'section-label';

export interface TypographyProps {
    children: React.ReactNode;
    variant?: TypographyVariant;
    as?: keyof JSX.IntrinsicElements;
    isBold?: boolean;
    isUppercase?: boolean;
    isSubtle?: boolean;
    isDanger?: boolean;
}

export type TypographyComponent = React.FC<TypographyProps>;
