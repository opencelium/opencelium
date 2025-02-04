import BaseOperator from "./BaseOperator";
import {BinaryOperatorName} from "../interfaces/OperatorName";

//left side: anything
//right side: string, "Integer" | "Double"
export default class IsTypeOf extends BaseOperator{

    constructor() {
        super({name: BinaryOperatorName.Contains})
    }
}
