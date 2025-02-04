import {DirectReferenceData, SourceType} from "@app_component/operator_builder/interfaces/IReference";

export default class DirectReference {
    reference: string;
    constructor(referenceOrColor: string, type?: SourceType, field?: string) {
        if (type && field) {
            this.reference = this.generateReference({color: referenceOrColor, type, field});
        } else {
            this.reference = referenceOrColor;
        }
    }

    extractData(): DirectReferenceData {
        const regex = /\{%(#[0-9A-Fa-f]{6})\.\((request|response)\)\.body\.\$\.(.*?)%\}/;
        const match = this.reference.match(regex);

        if (match) {
            return {
                color: match[1],
                type: match[2] as SourceType,
                field: match[3]
            };
        }

        return null;
    }

    generateReference(data: DirectReferenceData): string {
        return `{%${data.color}.(${data.type}).body.$.${data.field}%}`;
    }
}
