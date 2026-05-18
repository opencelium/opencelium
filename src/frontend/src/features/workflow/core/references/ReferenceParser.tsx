import React from 'react';
import { Reference } from "./ReferenceTypes";
import { ReferenceStrategy } from "./ReferenceStrategy";
import { EnhancementReference } from "./strategies/EnhancementReference";
import { WebhookReference } from "./strategies/WebhookReference";
import { RequiredDataReference } from "./strategies/RequiredDataReference";

export class ReferenceParser {
    private strategies: ReferenceStrategy[] = [
        new EnhancementReference(),
        new WebhookReference(),
        new RequiredDataReference(),
    ];

    parse(value: string): Reference | null {
        const strategy = this.strategies.find(s => s.match(value));
        return strategy ? strategy.parse(value) : null;
    }

    render({value, meta}: {value: string, readOnly?: boolean, meta?: any}): React.ReactNode {
        const strategy = this.strategies.find(s => s.match(value));
        if (!strategy) return value; // normal string
        const ref = strategy.parse(value);
        return strategy.render({ref, meta});
    }
}
