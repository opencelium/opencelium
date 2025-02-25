import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import {LoopOperatorName, OperatorName} from "@app_component/operator_builder/interfaces/OperatorName";
import For from "@app_component/operator_builder/classes/loop_operator/types/For";
import ForIn from "@app_component/operator_builder/classes/loop_operator/types/ForIn";
import SplitString from "@app_component/operator_builder/classes/loop_operator/types/SplitString";
import OperatorsConfigGenerator from "@app_component/operator_builder/classes/OperatorsConfigGenerator";
import {GroupProps, RulePropertyProps} from "@app_component/operator_builder/props";
import DirectReference from "@app_component/operator_builder/classes/references/DirectReference";
import WebhookReference from "@app_component/operator_builder/classes/references/WebhookReference";
import {generateUUID} from "@app_component/operator_builder/utils";

export default class LoopOperatorsConfigGenerator extends OperatorsConfigGenerator {

    constructor() {
        super(Object.values(LoopOperatorName))
    }
    generateTreeByExpression(expression: string): GroupProps {
        let groupProps = super.generateTreeByExpression(expression);
        if (!groupProps) {
            return this.generateTreeByForExpression(expression);
        }
        return groupProps;
    }
    generateTreeByForExpression(expression: string): GroupProps {
        let allOperators = Object.values([LoopOperatorName.For, LoopOperatorName.ForIn]).join('|');
        const anyStringRegExp = "'.*?'";
        const regex = new RegExp(
            `^(${allOperators})\\s+(${ // Operator first, then Left field
                String.raw`${DirectReference.getRegex().source}` + // direct_reference
                `|${WebhookReference.getRegex().source}` + // webhook_reference
                `|${anyStringRegExp}` // string
            })$`
        );
        const match = expression.match(regex);
        if (!match) {
            return null;
        }
        const properties: RulePropertyProps = {
            operator: match[1] as OperatorName,
            leftField: match[2],
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
    getOption(operatorName: LoopOperatorName): OptionType {
        switch (operatorName) {
            case LoopOperatorName.For:
                return (new For()).getOption();
            case LoopOperatorName.ForIn:
                return (new ForIn()).getOption();
            case LoopOperatorName.SplitString:
                return (new SplitString()).getOption();
        }
    }

    getOptions(operatorNames: LoopOperatorName[]): OptionType[] {
        let result: OptionType[] = [];
        for(let i = 0; i < operatorNames.length; i++) {
            result.push(this.getOption(operatorNames[i]));
        }
        return result;
    }

    getAllOptions(): OptionType[] {
        return this.getOptions(Object.values(LoopOperatorName));
    }
}
