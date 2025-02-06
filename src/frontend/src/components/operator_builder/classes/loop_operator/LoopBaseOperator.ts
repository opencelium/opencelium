import {LoopOperatorLabel, LoopOperatorName} from "@app_component/operator_builder/interfaces/OperatorName";
import BaseOperatorProps, {IBaseOperator, OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";

export default class LoopBaseOperator implements IBaseOperator, BaseOperatorProps<LoopOperatorName>{
    name: LoopOperatorName;
    constructor(props: BaseOperatorProps<LoopOperatorName>) {
        this.name = props.name;
    }

    getOption(): OptionType {
        return {
            value: this.name,
            label: LoopOperatorLabel[this.name],
        }
    }
}
