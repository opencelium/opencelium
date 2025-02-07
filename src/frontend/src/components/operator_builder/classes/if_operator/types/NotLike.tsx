import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

//left side: string
//right side: Pattern string (% is a wildcard)
export default class NotLike extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.NotLike})
    }
}
