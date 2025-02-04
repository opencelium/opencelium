import BaseOperator from "./BaseOperator";
import {BinaryOperatorName} from "../interfaces/OperatorName";

//left side: an array of strings, ["apple", "banana", "cherry"]
//right side: string, "banana"
export default class PropertyNotExists extends BaseOperator{

    constructor() {
        super({name: BinaryOperatorName.PropertyNotExists})
    }
}
