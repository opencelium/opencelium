import {DirectReferenceData, SourceType} from "@app_component/operator_builder/interfaces/IReference";
import BaseReference from "@app_component/operator_builder/classes/references/BaseReference";
import ReferenceFactory from "@app_component/operator_builder/classes/references/ReferenceFactory";
import {APIResponseType} from "@app_component/operator_builder/reference_generator/props";

export default class DirectReference extends BaseReference {
    constructor(referenceOrField: string, color?: string, type?: SourceType, apiResponseType?: APIResponseType) {
        super(color && type ? DirectReference.generateReference(referenceOrField, color, type, apiResponseType) : referenceOrField);
        this.type = "direct";
    }

    static getRegex(): RegExp {
        return /"?%?\{%(#[0-9A-Fa-f]{6})\.\((request|response)\)\.(body|header|status)(?:\.(.*?))?%\}%?"?/;
    }

    extractData(): DirectReferenceData | null {
        const regex = DirectReference.getRegex();
        const match = this.reference.match(regex);
        if (!match) return null;
        return match ? {
            color: match[1],
            type: match[2] as SourceType,
            apiResponseType: match[3] as APIResponseType,
            field: match[4] || ''
        } : null;
    }

    static generateReference(
        field: string,
        color: string,
        type: SourceType,
        apiResponseType?: APIResponseType
    ): string {
        switch (apiResponseType) {
            case 'body':
            case 'header':
                return `{%${color}.(${type}).${apiResponseType}.${!field ? field : field.startsWith('$.') ? field : field === '$' ? '$' : `$.${field}`}%}`;
            case 'status':
                return `{%${color}.(${type}).status%}`;
        }
    }
}

ReferenceFactory.registerType(DirectReference);
