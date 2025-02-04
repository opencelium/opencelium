import BaseOperator from "./BaseOperator";
import {BinaryOperatorName} from "../interfaces/OperatorName";

//left side: string
//right side: Pattern string (% is a wildcard)
export default class Like extends BaseOperator{

    constructor() {
        super({name: BinaryOperatorName.Like})
    }
}
