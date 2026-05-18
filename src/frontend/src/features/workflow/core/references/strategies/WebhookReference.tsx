import React from 'react';
import {ReferenceStrategy} from "../ReferenceStrategy";
import {Reference} from "../ReferenceTypes";
import {ReferenceItem} from "../components/webhook/ReferenceItem";

export class WebhookReference implements ReferenceStrategy {
    match(value: string): boolean {
        return /^\$\{.*\}$/.test(value);
    }

    parse(value: string): Reference {
        const url = value.slice(2, -1);
        return { type: 'webhook', url };
    }
    render({meta, ref, readOnly, props}: {meta: {clearValue: () => void}, readOnly?: boolean, ref: Reference, props: React.HTMLProps<HTMLSpanElement>}): React.ReactNode {
        if (ref.type !== "webhook") return null;
        return (
            <ReferenceItem value={ref.url} onDelete={meta.clearValue} readOnly={readOnly}/>
        );
    }
}
