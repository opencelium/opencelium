import {
    DirectReferenceData,
    WebhookReferenceData
} from "@app_component/operator_builder/interfaces/IReference";
import BaseReference from "@app_component/operator_builder/classes/references/BaseReference";
import ReferenceFactory from "@app_component/operator_builder/classes/references/ReferenceFactory";
export default class WebhookReference extends BaseReference {
    constructor(reference: string) {
        super(reference);
        this.type = "webhook";
    }

    extractData(): WebhookReferenceData | null {
        const splitReference = this.reference.split(':');
        let result = null;
        if (splitReference.length === 2
            && splitReference[0].startsWith('${')
            && splitReference[1].endsWith('}')
        ) {
            result = { name: splitReference[0].substring(2), type: splitReference[1].slice(0, -1) };
        }
        return result;
    }

    static generateReference(name: string, type: string): string {
        return `$\{${name}:${type}}`;
    }
}
ReferenceFactory.registerType(WebhookReference);
