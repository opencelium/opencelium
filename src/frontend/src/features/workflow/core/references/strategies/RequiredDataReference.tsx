import React from 'react';
import type {ReferenceStrategy} from "../ReferenceStrategy";
import type {Reference} from "../ReferenceTypes";

export class RequiredDataReference implements ReferenceStrategy {
    match(value: string): boolean {
        return /^\{.*\}$/.test(value) && !value.startsWith('#{') && !value.startsWith('${');
    }

    parse(value: string): Reference {
        const key = value.slice(1, -1);
        return { type: 'requiredData', key };
    }

    render({ref, props}: {ref: Reference, props: React.HTMLProps<HTMLSpanElement>}): React.ReactNode {
        if (ref.type !== "requiredData") return null;
        return (
            <span style={{ color: "var(--color-status-success-fg)" }} {...props}>
                🔑 Required: {ref.key}
            </span>
        );
    }
}
