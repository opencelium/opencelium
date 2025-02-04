import BaseOperator from "./BaseOperator";
import {BinaryOperatorName} from "../interfaces/OperatorName";

//left side: string
//right side: string - regular expression
export default class RegEx extends BaseOperator{

    constructor() {
        super({name: BinaryOperatorName.RegEx})
    }
}
