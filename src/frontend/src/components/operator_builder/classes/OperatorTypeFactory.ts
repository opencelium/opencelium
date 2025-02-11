import {GroupProps, OperatorType, RulePropertyProps, RuleUIProps} from "@app_component/operator_builder/props";
import IfOperator from "./if_operator/IfOperator";
import LoopOperator from "./loop_operator/LoopOperator";
import IfOperatorsConfigGenerator from "@app_component/operator_builder/classes/if_operator/IfOperatorsConfigGenerator";
import LoopOperatorsConfigGenerator
    from "@app_component/operator_builder/classes/loop_operator/LoopOperatorsConfigGenerator";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import {
    AllOperatorNames,
    LoopOperatorName,
    OperatorName
} from "@app_component/operator_builder/interfaces/OperatorName";
import {generateUUID} from "@app_component/operator_builder/utils";
import DirectReference from "@app_component/operator_builder/classes/references/DirectReference";
import WebhookReference from "@app_component/operator_builder/classes/references/WebhookReference";

export default class OperatorTypeFactory {
    type: OperatorType;
    constructor(type: OperatorType) {
        this.type = type;
    }

    generateTreeByExpression(expression: string): GroupProps {
        let allOperators = Object.values(AllOperatorNames).join('|');
        switch (this.type) {
            case OperatorType.If:
                allOperators = Object.values(AllOperatorNames).join('|');
                break;
            case OperatorType.Loop:
                allOperators = Object.values(LoopOperatorName).join('|');
                break;
        }
        //const regex = `/(\{%(#[0-9A-Fa-f]{6})\.\((request|response)\)\.body\.\$\.(.*?)%\}|\${.*?}|'(.*?)')\s+(${allOperators})\s+(\{%(#[0-9A-Fa-f]{6})\.\((request|response)\)\.body\.\$\.(.*?)%\}|\${.*?}|'(.*?)')/`;
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
        if (match[8]) {
            properties.rightField = match[8];
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
    getInitialTree(): GroupProps {
        switch (this.type) {
            case OperatorType.If:
                return IfOperator.getInitialTree();
            case OperatorType.Loop:
                return LoopOperator.getInitialTree();
        }
    }
    getOptions(): OptionType[] {
        switch (this.type) {
            case OperatorType.If:
                return (new IfOperatorsConfigGenerator()).getAllOptions();
            case OperatorType.Loop:
                return (new LoopOperatorsConfigGenerator()).getAllOptions();
        }
    }
    getExpressionFormat(ruleProps: RulePropertyProps): string {
        switch (this.type) {
            case OperatorType.If:
                return IfOperator.getExpressionFormat(ruleProps);
            case OperatorType.Loop:
                return LoopOperator.getExpressionFormat(ruleProps);
        }
    }
    isExpressionNotValid(ruleProps: RulePropertyProps): boolean {
        switch (this.type) {
            case OperatorType.If:
                return IfOperator.isExpressionNotValid(ruleProps);
            case OperatorType.Loop:
                return LoopOperator.isExpressionNotValid(ruleProps);
        }
    }
    getRuleComponent(ruleProps: RuleUIProps): string {
        switch (this.type) {
            case OperatorType.If:
                return IfOperator.getRuleComponent(ruleProps);
            case OperatorType.Loop:
                return LoopOperator.getRuleComponent(ruleProps);
        }
    }
}
