import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

//left side: anything
//right side: string, "Integer" | "Double"
export default class IsTypeOf extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.IsTypeOf})
    }
}
