import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

//left side: string
//right side: string - regular expression
export default class Matches extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.Matches})
    }
}
