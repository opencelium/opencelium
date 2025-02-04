import BaseOperator from "./BaseOperator";
import {BinaryOperatorName} from "../interfaces/OperatorName";

//left side: string
//right side: string - regular expression
export default class Matches extends BaseOperator{

    constructor() {
        super({name: BinaryOperatorName.Matches})
    }
}
