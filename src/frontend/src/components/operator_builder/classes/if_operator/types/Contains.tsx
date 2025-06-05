import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

//left side: an array of strings, ["apple", "banana", "cherry"]
//right side: string, "banana"
export default class Contains extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.Contains, placeholder: 'contains'})
    }
}
