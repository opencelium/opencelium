import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

//left side: an array of strings, ["apple", "banana", "cherry"]
//right side: string, "banana"
export default class PropertyExists extends IfBaseOperator{

    constructor() {
        super({
            name: BinaryOperatorName.PropertyExists,
            placeholder: 'Property',
            defaultRefType: 'constant',
        })
    }
}
