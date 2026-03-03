import {LoopOperatorLabel, LoopOperatorName} from "@app_component/operator_builder/interfaces/OperatorName";
import BaseOperatorProps, {IBaseOperator, OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import {
    ConstantComponentType,
    ConstantSelectOptions,
    ReferenceType
} from "@app_component/operator_builder/reference_generator/props";
import {Step} from "react-joyride";
import {getLoopOperatorTours} from "@app_component/operator_builder/tourSteps";

export default class LoopBaseOperator implements IBaseOperator, BaseOperatorProps<LoopOperatorName>{
    name: LoopOperatorName;
    placeholder?: string;
    defaultRefType: ReferenceType;
    defaultConstantType: ConstantComponentType;
    selectOptions?: ConstantSelectOptions[];
    constructor(props: BaseOperatorProps<LoopOperatorName>) {
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
            label: LoopOperatorLabel[this.name],
        }
    }

    getTourSteps(): Step[] {
        return getLoopOperatorTours(this.name);
    }
}
