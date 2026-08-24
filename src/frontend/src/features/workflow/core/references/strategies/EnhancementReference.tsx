import React from 'react';
import type { ReferenceStrategy } from "../ReferenceStrategy";
import type { Reference } from "../ReferenceTypes";
import type { Enhancement } from "../../../types/connection";
import { Reference as ReferenceComponent } from '../components/enhancemen/Reference';
import { NOT_EXIST_ARG } from '../../../utils/enhancementArgs';

export class EnhancementReference implements ReferenceStrategy {

    /** Kept for its existing consumers; the literal lives with the helper that
     *  writes it into a script (see dropEnhancementArgs). */
    static NotExistArg = NOT_EXIST_ARG;
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
