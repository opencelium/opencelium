import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

export default class NotContains extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.NotContains})
    }
}
