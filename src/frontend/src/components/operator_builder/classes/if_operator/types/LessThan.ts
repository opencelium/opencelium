import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

export default class LessThan extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.LessThan})
    }
}
