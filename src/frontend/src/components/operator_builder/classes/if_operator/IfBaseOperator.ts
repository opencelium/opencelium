import BaseOperatorProps, {IBaseOperator, OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import {OperatorLabel, OperatorName} from "@app_component/operator_builder/interfaces/OperatorName";


export default class IfBaseOperator implements IBaseOperator, BaseOperatorProps<OperatorName>{
    name: OperatorName;
    constructor(props: BaseOperatorProps<OperatorName>) {
        this.name = props.name;
    }

    getOption(): OptionType {
        return {
            value: this.name,
            label: OperatorLabel[this.name],
        }
    }
}
