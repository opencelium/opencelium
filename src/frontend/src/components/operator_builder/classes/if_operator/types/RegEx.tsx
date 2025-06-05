import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

//left side: string
//right side: string - regular expression
export default class RegEx extends IfBaseOperator{

    constructor() {
        super({
            name: BinaryOperatorName.RegEx,
            placeholder: 'Regular Expression',
            defaultRefType: 'constant',
        })
    }
}
