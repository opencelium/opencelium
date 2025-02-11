import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

export default class NotEqual extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.NotEqual})
    }
}
