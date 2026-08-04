import React from 'react';
import type {Reference} from "./ReferenceTypes";

export interface ReferenceStrategy {
    match(value: string): boolean;
    parse(value: string): Reference;
    render(data: {ref: Reference, meta?: any}): React.ReactNode;
}
