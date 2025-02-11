import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

export default class GreaterThanOrEqualTo extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.GreaterThanOrEqualTo})
    }
}
