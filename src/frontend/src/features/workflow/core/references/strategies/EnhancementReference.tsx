import React from 'react';
import { ReferenceStrategy } from "../ReferenceStrategy";
import { Reference } from "../ReferenceTypes";
import type { Enhancement } from "../../types/connection";
import { Reference as ReferenceComponent } from '../components/enhancemen/Reference';

export class EnhancementReference implements ReferenceStrategy {

    static NotExistArg = 'VARIABLE_NOT_EXIST';
    match(value: string) {
        return /^#\{.*\}$/.test(value);
    }
    parse(value: string): Reference {
        const id = value.slice(2, -1);
        return { type: "enhancement", id };
    }
    render({ref, meta}: {meta?: {enhancement: Enhancement, onClick: () => void, clearValue: () => void}, readOnly?: boolean, ref: Reference}): React.ReactNode {
        if (ref.type !== "enhancement" || !meta?.enhancement) return null;
        return (
            <ReferenceComponent
                enhancement={meta?.enhancement}
                clearValue={meta.clearValue}
                onClick={() => meta?.onClick()}
            />
        )
    }
}
