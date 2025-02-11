import {GroupProps, OperatorType, RulePropertyProps, RuleUIProps} from "@app_component/operator_builder/props";
import IfOperator from "./if_operator/IfOperator";
import LoopOperator from "./loop_operator/LoopOperator";
import IfOperatorsConfigGenerator from "@app_component/operator_builder/classes/if_operator/IfOperatorsConfigGenerator";
import LoopOperatorsConfigGenerator
    from "@app_component/operator_builder/classes/loop_operator/LoopOperatorsConfigGenerator";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";

export default class OperatorTypeFactory {
    type: OperatorType;
    constructor(type: OperatorType) {
        this.type = type;
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
