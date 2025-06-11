import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName, LoopOperatorName, OperatorName} from "../../../interfaces/OperatorName";

//left side: string
//right side: Pattern string (% is a wildcard)
export default class Like extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.Like})
    }

    static isLikeOperator(operator: OperatorName | LoopOperatorName | ""): boolean {
        return operator === BinaryOperatorName.Like || operator === BinaryOperatorName.NotLike
    }
}
