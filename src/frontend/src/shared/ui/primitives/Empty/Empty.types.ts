import type { ReactNode } from 'react';
import React from 'react';

export interface EmptyProps {
    /** Placeholder text shown under the illustration. */
    description?: ReactNode;
    /** Custom illustration/icon; falls back to the kit's default when omitted (`undefined`).
     * Pass `null` explicitly to render no icon at all. */
    image?: ReactNode | null;
    /** Extra content (actions) rendered below the description. */
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export type EmptyComponent = React.FC<EmptyProps>;
