import BaseOperator from "./BaseOperator";
import {BinaryOperatorName} from "../interfaces/OperatorName";

//left side: an array of strings, ["hello", "world", "java"]
//right side: substring, "wor"
export default class ContainsSubStr extends BaseOperator{

    constructor() {
        super({name: BinaryOperatorName.ContainsSubStr})
    }
}
