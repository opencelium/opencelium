import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

export default class LessThanOrEqual extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.LessThanOrEqualTo})
    }
}
