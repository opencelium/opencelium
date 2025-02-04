import {OperatorName} from "@app_component/operator_builder/interfaces/OperatorName";

export default interface BaseOperatorProps {
    name: OperatorName;
}

export interface OperatorProps extends Omit<BaseOperatorProps, "name"> {

}

export interface OptionType {
    value: string,
    label: string,
}

export interface IBaseOperator {
    getOption: () => OptionType;
}
