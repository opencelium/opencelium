import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

//left side: an array of strings, ["hello", "world", "java"]
//right side: substring, "wor"
export default class ContainsSubStr extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.ContainsSubStr})
    }
}
