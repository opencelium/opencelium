import {GroupProps, OperatorType, RulePropertyProps} from "@app_component/operator_builder/props";
import {
    AllOperatorNames,
    LoopOperatorName,
    OperatorName
} from "@app_component/operator_builder/interfaces/OperatorName";
import DirectReference from "@app_component/operator_builder/classes/references/DirectReference";
import WebhookReference from "@app_component/operator_builder/classes/references/WebhookReference";
import {generateUUID} from "@app_component/operator_builder/utils";
import {EmptyString} from "@app_component/operator_builder/reference_generator/ReferenceGenerator";

export default class OperatorsConfigGenerator {

    operatorsNames: any[];

    constructor(operatorsName: any[]) {
        this.operatorsNames = operatorsName;
    }

    generateTreeByExpression(expression: string): GroupProps {
        let allOperators = Object.values(this.operatorsNames).join('|');
        const anyStringRegExp = /'.*?'/;
        const regex = new RegExp(
            `^(${ // Left field
                String.raw`${DirectReference.getRegex().source}` + // direct_reference
                `|${WebhookReference.getRegex().source}` + // webhook_reference
                `|${anyStringRegExp.source}` // string
            })\\s+(${allOperators})` + // Operator
            `(?:\\s+(${ // Right field (optional)
                String.raw`${DirectReference.getRegex().source}` + // direct_reference
                `|${WebhookReference.getRegex().source}` + // webhook_reference
                `|${anyStringRegExp.source}` // string
            }))?$`
        );
        const match = expression.match(regex);
        if (!match) {
            return null;
        }
        let leftField = match[1];
        if (leftField.startsWith(`'`) && leftField.endsWith(`'`)) {
            leftField = leftField.substring(1, leftField.length - 1);
        }
        const properties: RulePropertyProps = {
            leftField,
            operator: match[6] as OperatorName,
        }
        if (match[7]) {
            let rightField = match[7];
            if (rightField.startsWith(`'`) && rightField.endsWith(`'`)) {
                rightField = rightField.substring(1, rightField.length - 1);
            }
            properties.rightField = rightField === '' ? EmptyString : rightField;
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
