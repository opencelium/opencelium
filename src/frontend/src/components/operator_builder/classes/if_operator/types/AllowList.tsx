import IfBaseOperator from "../IfBaseOperator";
import {BinaryOperatorName} from "../../../interfaces/OperatorName";

//left side: a string, "guest"
//right side: a list of strings represented as text divided with comma, "quest,user,manager"
export default class AllowList extends IfBaseOperator{

    constructor() {
        super({name: BinaryOperatorName.AllowList})
    }
}
