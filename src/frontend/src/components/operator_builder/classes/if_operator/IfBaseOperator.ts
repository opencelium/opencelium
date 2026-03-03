import BaseOperatorProps, {IBaseOperator, OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import {OperatorLabel, OperatorName} from "@app_component/operator_builder/interfaces/OperatorName";
import {
    ConstantComponentType,
    ConstantSelectOptions,
    ReferenceType
} from "@app_component/operator_builder/reference_generator/props";
import {Step} from "react-joyride";
import {getIfOperatorTours} from "@app_component/operator_builder/tourSteps";


export default class IfBaseOperator implements IBaseOperator, BaseOperatorProps<OperatorName>{
    name: OperatorName;
    placeholder?: string;
    defaultRefType: ReferenceType;
    defaultConstantType: ConstantComponentType;
    selectOptions?: ConstantSelectOptions[];
    constructor(props: BaseOperatorProps<OperatorName>) {
        this.name = props.name;
        if (props.placeholder) {
            this.placeholder = props.placeholder;
        }
        this.defaultRefType = props.defaultRefType || 'direct';
        this.defaultConstantType = props.defaultConstantType || ConstantComponentType.Text;
        if (props.selectOptions && props.selectOptions.length > 0) {
            this.selectOptions = props.selectOptions;
        }
    }

    getOption(): OptionType {
        return {
            value: this.name,
            label: OperatorLabel[this.name],
        }
    }

    getTourSteps(): Step[] {
        return getIfOperatorTours(this.name);
    }
}
