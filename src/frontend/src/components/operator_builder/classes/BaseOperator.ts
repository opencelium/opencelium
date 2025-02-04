import BaseOperatorProps, {IBaseOperator, OptionType} from "../interfaces/IBaseOperator";
import {OperatorLabel, OperatorName} from "../interfaces/OperatorName";

export default class BaseOperator implements IBaseOperator, BaseOperatorProps{
    name: OperatorName;
    constructor(props: BaseOperatorProps) {
        this.name = props.name;
    }

    getOption(): OptionType {
        return {
            value: this.name,
            label: OperatorLabel[this.name],
        }
    }
}
