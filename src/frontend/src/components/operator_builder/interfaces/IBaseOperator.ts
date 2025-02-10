import {LoopOperatorName, OperatorName} from "@app_component/operator_builder/interfaces/OperatorName";

export default interface BaseOperatorProps<Operator> {
    name: Operator;
}

export interface OperatorProps<Operator> extends Omit<BaseOperatorProps<Operator>, "name"> {

}

export interface OptionType {
    value: string,
    label: string,
}

export interface IBaseOperator {
    getOption: () => OptionType;
}
