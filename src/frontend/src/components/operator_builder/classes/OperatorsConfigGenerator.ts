import {GroupProps, OperatorType, RulePropertyProps} from "@app_component/operator_builder/props";
import {
    AllOperatorNames,
    LoopOperatorName,
    OperatorName
} from "@app_component/operator_builder/interfaces/OperatorName";
import DirectReference from "@app_component/operator_builder/classes/references/DirectReference";
import WebhookReference from "@app_component/operator_builder/classes/references/WebhookReference";
import {generateUUID} from "@app_component/operator_builder/utils";

export default class OperatorsConfigGenerator {

    operatorsNames: any[];

    constructor(operatorsName: any[]) {
        this.operatorsNames = operatorsName;
    }

    generateTreeByExpression(expression: string): GroupProps {
        let allOperators = Object.values(this.operatorsNames).join('|');
        const anyStringRegExp = "'.*?'";
        const regex = new RegExp(
            `^(${ // Left field
                String.raw`${DirectReference.getRegex().source}` + // direct_reference
                `|${WebhookReference.getRegex().source}` + // webhook_reference
                `|${anyStringRegExp}` // string
            })\\s+(${allOperators})` + // Operator
            `(?:\\s+(${ // Right field (optional)
                String.raw`${DirectReference.getRegex().source}` + // direct_reference
                `|${WebhookReference.getRegex().source}` + // webhook_reference
                `|${anyStringRegExp}` // string
            }))?$`
        );
        const match = expression.match(regex);
        if (!match) {
            return null;
        }
        const properties: RulePropertyProps = {
            leftField: match[1],
            operator: match[5] as OperatorName,
        }
        if (match[6]) {
            properties.rightField = match[6];
        }
        return {
            id: generateUUID(),
            type: 'group',
            properties: {
                not: false,
            },
            items: [
                {
                    id: generateUUID(),
                    type: 'rule',
                    properties,
                }
            ]
        };
    }
}
