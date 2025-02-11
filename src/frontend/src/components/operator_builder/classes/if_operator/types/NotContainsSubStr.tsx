import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

export default class NotContainsSubStr extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.NotContainsSubStr})
    }
}
