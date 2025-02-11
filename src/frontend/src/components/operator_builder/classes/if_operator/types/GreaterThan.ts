import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

export default class GreaterThan extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.GreaterThan})
    }
}
