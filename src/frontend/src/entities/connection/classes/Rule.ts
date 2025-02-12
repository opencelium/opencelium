import {RuleBaseModel} from "@root/requests/models/Rule";

export default class Rule {
    static getRulesForForm(places: {isUrl: boolean, isHeader: boolean, isRequest: boolean, isResponse: boolean}): RuleBaseModel[] {
        const rules: RuleBaseModel[] = [];
        if(places.isUrl) {
            rules.push({
                expression: '#[*].(request).url',
                type: 'JSONPath'
            })
        }
        if(places.isHeader) {
            rules.push({
                expression: '#[*].(request).header',
                type: 'JSONPath'
            })
        }
        if(places.isRequest) {
            rules.push({
                expression: '#[*].(request).body',
                type: 'JSONPath'
            })
        }
        if(places.isResponse) {
            rules.push({
                expression: '#[*].(response).body',
                type: 'JSONPath'
            })
        }
        return rules;
    }
}
