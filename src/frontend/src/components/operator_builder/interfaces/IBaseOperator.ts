import {
    ConstantComponentType,
    ConstantSelectOptions,
    ReferenceType
} from "@app_component/operator_builder/reference_generator/props";

export default interface BaseOperatorProps<Operator> {
    name: Operator;
    placeholder?: string,
    defaultRefType?: ReferenceType,
    defaultConstantType?: ConstantComponentType,
    selectOptions?: ConstantSelectOptions[],
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
