import {DirectReferenceData, SourceType} from "@app_component/operator_builder/interfaces/IReference";
import BaseReference from "@app_component/operator_builder/classes/references/BaseReference";
import ReferenceFactory from "@app_component/operator_builder/classes/references/ReferenceFactory";

export default class DirectReference extends BaseReference {
    constructor(referenceOrField: string, color?: string, type?: SourceType) {
        super(color && type ? DirectReference.generateReference(referenceOrField, color, type) : referenceOrField);
        this.type = "direct";
    }

    static getRegex(): RegExp {
        return /"?%?\{%(#[0-9A-Fa-f]{6})\.\((request|response)\)\.body\.\$(?:\.([^%]*))?%\}%?"?/;
    }

    extractData(): DirectReferenceData | null {
        const regex = DirectReference.getRegex();
        const match = this.reference.match(regex);
        return match ? { color: match[1], type: match[2] as SourceType, field: match[3] } : null;
    }

    static generateReference(field: string, color: string, type: SourceType): string {
        return `{%${color}.(${type}).body.${!field ? field : field.startsWith('$.') ? field : field === '$' ? '$' : `$.${field}`}%}`;
    }
}

ReferenceFactory.registerType(DirectReference);
